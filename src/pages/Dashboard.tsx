import { useState, useMemo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/layout/Navbar";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useCategories, useNeighborhoods } from "@/hooks/useCatalog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, MapPin, Timer, Percent,
  XCircle, RefreshCw, Flame, Thermometer, Users, ListChecks, ShieldQuestion,
  Sparkles, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useCityOverview, useNeighborhoodStats, useCategoryStats, useValidationStats } from "@/hooks/useStats";

const COLORS = ['#7C3AED', '#0D9488', '#EAB308', '#EF4444', '#22C55E', '#A855F7', '#F97316', '#0EA5E9'];

// ----- Mapa de densidade reutilizável (Leaflet + OpenStreetMap)
const HeatmapView = ({ points }: { points: Array<{ lat: number; lng: number }> }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: [-27.0078, -51.1519],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      maxZoom: 19,
      subdomains: "abc",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapInstance.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    points
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      .forEach((point) => {
        L.circleMarker([point.lat, point.lng], {
          radius: 16,
          color: "rgba(239,68,68,0.85)",
          weight: 1,
          fillColor: "rgba(249,115,22,0.65)",
          fillOpacity: 0.55,
        }).addTo(layer);
      });
  }, [points]);
  return <div ref={mapRef} className="w-full h-[500px] rounded-lg bg-muted" />;
};

const Kpi = ({ label, value, icon: Icon, accent = "text-primary", trend }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${accent} opacity-80`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      {trend != null && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-[hsl(var(--status-validated))]' : 'text-destructive'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}% vs período anterior
        </p>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [period, setPeriod] = useState("6m");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const { categories } = useCategories();
  const { neighborhoods } = useNeighborhoods();
  // Estatísticas computadas a partir das ocorrências reais do backend.
  const { reports: _r0 } = useOccurrences();
  const stats = useMemo(() => {
    const reports = _r0;
    // Agrupamento por bairro (Total / Resolvidos)
    const byHood = new Map<string, { name: string; total: number; resolved: number }>();
    reports.forEach(r => {
      const cur = byHood.get(r.neighborhood) ?? { name: r.neighborhood, total: 0, resolved: 0 };
      cur.total += 1;
      if (["resolvido", "resolucao_validada"].includes(r.status as any)) cur.resolved += 1;
      byHood.set(r.neighborhood, cur);
    });
    // Status com rótulo + cor
    const statusMeta: Record<string, { name: string; color: string }> = {
      aguardando_validacao: { name: "Aguardando Validação", color: "#A855F7" },
      em_analise: { name: "Em Análise", color: "#EAB308" },
      em_execucao: { name: "Em Execução", color: "#0D9488" },
      resolvido: { name: "Resolvido", color: "#22C55E" },
      resolucao_validada: { name: "Validado", color: "#16A34A" },
      resolucao_rejeitada: { name: "Rejeitado", color: "#EF4444" },
    };
    const stCounts: Record<string, number> = {};
    reports.forEach(r => { stCounts[r.status] = (stCounts[r.status] ?? 0) + 1; });
    // Evolução mensal (últimos 6 meses)
    const months: { month: string; total: number; resolved: number; unresolved: number }[] = [];
    const monthLabels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const list = reports.filter(r => {
        const t = new Date(r.createdAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      const resolved = list.filter(r => ["resolvido","resolucao_validada"].includes(r.status as any)).length;
      months.push({ month: monthLabels[d.getMonth()], total: list.length, resolved, unresolved: list.length - resolved });
    }
    const totalRecurrences = reports.filter(r => r.isRecurrence).length;
    const recurrenceRate = reports.length ? +((totalRecurrences / reports.length) * 100).toFixed(1) : 0;
    return {
      reportsByNeighborhood: Array.from(byHood.values()).sort((a,b) => b.total - a.total),
      reportsByStatus: Object.entries(stCounts).map(([k, v]) => ({
        name: statusMeta[k]?.name ?? k,
        value: v,
        color: statusMeta[k]?.color ?? "#999",
      })),
      reportsByMonth: months,
      totalRecurrences,
      recurrenceRate,
    };
  }, [_r0]);
  const { reports } = useOccurrences();
  const overview = useCityOverview();
  const byNeighborhood = useNeighborhoodStats();
  const byCategory = useCategoryStats();
  const validation = useValidationStats();

  const neighborhoodsByUnresolved = useMemo(() => [...byNeighborhood].sort((a, b) => b.pending - a.pending), [byNeighborhood]);
  const neighborhoodsByRecurrence = useMemo(() => [...byNeighborhood].filter(n => n.recurrent > 0).sort((a, b) => b.recurrent - a.recurrent), [byNeighborhood]);
  const neighborhoodsByVandalism = useMemo(() => [...byNeighborhood].filter(n => n.vandalism > 0).sort((a, b) => b.vandalism - a.vandalism), [byNeighborhood]);
  const neighborhoodsByLighting = useMemo(() => [...byNeighborhood].filter(n => n.lighting > 0).sort((a, b) => b.lighting - a.lighting), [byNeighborhood]);
  const neighborhoodsByEfficiency = useMemo(() => [...byNeighborhood].filter(n => n.total >= 2).sort((a, b) => b.resolutionRate - a.resolutionRate), [byNeighborhood]);

  const heatmapPoints = useMemo(() => reports.map(r => ({ lat: r.lat, lng: r.lng })), [reports]);
  const uniqueReporters = useMemo(() => new Set(reports.map(r => (r as any).author_id ?? r.id)).size, [reports]);

  // Vandalismo
  const vandalismSubcat = useMemo(() => {
    const sub = categories.find(c => c.slug === "vandalismo" || c.name.toLowerCase().includes("vandalismo"))?.subcategories ?? [];
    return sub.map(s => ({
      name: s.name,
      value: reports.filter(r => r.subcategoryId === s.id).length,
    }));
  }, [reports, categories]);

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Minha Cidade — Estatísticas Públicas de Videira/SC" description="Dashboard público da ZUP com estatísticas de zeladoria urbana, bairros, categorias e tempo médio de resolução em Videira/SC." path="/minha-cidade" />
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Minha Cidade</h1>
            <p className="text-muted-foreground text-sm">Estatísticas públicas de zeladoria urbana — Videira/SC</p>
          </div>
          <div className="flex gap-2">
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="w-[160px]">
                <MapPin className="w-4 h-4 mr-1" /><SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bairros</SelectItem>
                {neighborhoods.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mês</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="bairros">Bairros</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="pendentes">Pendências</TabsTrigger>
            <TabsTrigger value="resolvidas">Resolvidas</TabsTrigger>
            <TabsTrigger value="reincidencia">Reincidência</TabsTrigger>
            <TabsTrigger value="validacao">Validação</TabsTrigger>
            <TabsTrigger value="participacao">Participação</TabsTrigger>
            <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
          </TabsList>

          {/* ====== VISÃO GERAL ====== */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Kpi label="Total" value={overview.total} icon={ListChecks} />
              <Kpi label="Ativas" value={overview.active} icon={Clock} accent="text-[hsl(var(--status-analysis))]" />
              <Kpi label="Resolvidas" value={overview.resolved} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Pendentes" value={overview.unresolved} icon={XCircle} accent="text-destructive" />
              <Kpi label="Taxa resolução" value={`${overview.resolutionRate}%`} icon={Percent} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Tempo médio" value={`${overview.avgResolutionDays}d`} icon={Timer} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Hoje" value={overview.todayCount} icon={Sparkles} />
              <Kpi label="Esta semana" value={overview.weekCount} icon={Sparkles} />
              <Kpi label="Este mês" value={overview.monthCount} icon={Sparkles} trend={overview.growthPct} />
              <Kpi label="1ª resposta média" value={`${overview.avgResponseDays}d`} icon={Timer} accent="text-[hsl(var(--status-execution))]" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Ocorrências por bairro</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={stats.reportsByNeighborhood} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Registradas" />
                      <Bar dataKey="resolved" fill="hsl(var(--status-validated))" radius={[0, 4, 4, 0]} name="Resolvidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Distribuição por status</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={stats.reportsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {stats.reportsByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Evolução temporal</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.reportsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Registradas" />
                    <Area type="monotone" dataKey="resolved" stroke="hsl(var(--status-validated))" fill="hsl(var(--status-validated))" fillOpacity={0.2} name="Resolvidas" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== BAIRROS ====== */}
          <TabsContent value="bairros" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-destructive" /> Bairro mais crítico</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{neighborhoodsByUnresolved[0]?.name}</p><p className="text-sm text-muted-foreground">{neighborhoodsByUnresolved[0]?.pending} pendências</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-validated))]" /> Mais eficiente</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{neighborhoodsByEfficiency[0]?.name ?? '—'}</p><p className="text-sm text-muted-foreground">{neighborhoodsByEfficiency[0]?.resolutionRate ?? 0}% resolução</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-accent" /> Mais reincidente</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{neighborhoodsByRecurrence[0]?.name ?? '—'}</p><p className="text-sm text-muted-foreground">{neighborhoodsByRecurrence[0]?.recurrent ?? 0} casos</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Ranking completo de bairros</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2">Bairro</th><th className="text-right py-2 px-2">Total</th>
                      <th className="text-right py-2 px-2">Resolvidas</th><th className="text-right py-2 px-2">Pendentes</th>
                      <th className="text-right py-2 px-2">Reincidência</th><th className="text-right py-2 px-2">Taxa</th>
                    </tr></thead>
                    <tbody>{byNeighborhood.map(n => (
                      <tr key={n.name} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">{n.name}</td>
                        <td className="text-right py-2 px-2">{n.total}</td>
                        <td className="text-right py-2 px-2 text-[hsl(var(--status-validated))]">{n.resolved}</td>
                        <td className="text-right py-2 px-2 text-destructive">{n.pending}</td>
                        <td className="text-right py-2 px-2 text-accent">{n.recurrent}</td>
                        <td className="text-right py-2 px-2">{n.resolutionRate}%</td>
                      </tr>))}</tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Vandalismo por bairro</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={neighborhoodsByVandalism} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip /><Bar dataKey="vandalism" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Iluminação por bairro</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={neighborhoodsByLighting} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip /><Bar dataKey="lighting" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== CATEGORIAS ====== */}
          <TabsContent value="categorias" className="space-y-6 mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Volume por categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={byCategory} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={170} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Total" />
                    <Bar dataKey="resolved" fill="hsl(var(--status-validated))" radius={[0, 4, 4, 0]} name="Resolvidas" />
                    <Bar dataKey="pending" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent" /> Vandalismo — detalhamento</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vandalismSubcat.map(s => (
                    <div key={s.name} className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-3xl font-extrabold text-accent">{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== PENDÊNCIAS ====== */}
          <TabsContent value="pendentes" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Pendentes" value={overview.unresolved} icon={XCircle} accent="text-destructive" />
              <Kpi label="Em análise" value={overview.inAnalysis} icon={Clock} accent="text-[hsl(var(--status-analysis))]" />
              <Kpi label="Em execução" value={overview.inExecution} icon={TrendingUp} accent="text-[hsl(var(--status-execution))]" />
              <Kpi label="Aguard. validação" value={overview.awaitingValidation} icon={ShieldQuestion} accent="text-accent" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flame className="w-4 h-4 text-destructive" /> Bairros com mais pendências</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={neighborhoodsByUnresolved} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="pending" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== RESOLVIDAS ====== */}
          <TabsContent value="resolvidas" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Resolvidas" value={overview.resolved} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Validadas pela comunidade" value={overview.resolutionValidated} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Rejeitadas" value={overview.resolutionRejected} icon={XCircle} accent="text-destructive" />
              <Kpi label="Tempo médio" value={`${overview.avgResolutionDays}d`} icon={Timer} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Bairros mais eficientes em resolução</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={neighborhoodsByEfficiency} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="resolutionRate" fill="hsl(var(--status-validated))" radius={[0, 4, 4, 0]} name="Taxa de resolução %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== REINCIDÊNCIA ====== */}
          <TabsContent value="reincidencia" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Total reincidências" value={stats.totalRecurrences} icon={RefreshCw} accent="text-accent" />
              <Kpi label="Taxa reincidência" value={`${stats.recurrenceRate}%`} icon={Percent} accent="text-accent" />
              <Kpi label="Bairro + reincidente" value={neighborhoodsByRecurrence[0]?.name ?? '—'} icon={MapPin} />
              <Kpi label="Casos no bairro" value={neighborhoodsByRecurrence[0]?.recurrent ?? 0} icon={AlertTriangle} accent="text-accent" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Reincidência por bairro</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={neighborhoodsByRecurrence}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Bar dataKey="recurrent" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Reincidências" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== VALIDAÇÃO ====== */}
          <TabsContent value="validacao" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Aguardando validação" value={validation.awaiting} icon={ShieldQuestion} accent="text-accent" />
              <Kpi label="Total de validações" value={validation.totalValidations} icon={CheckCircle2} accent="text-[hsl(var(--status-validated))]" />
              <Kpi label="Casos com 6 validadores" value={validation.requiredSix} icon={Users} />
              <Kpi label="Média validadores/caso" value={validation.avgValidatorsPerReport} icon={Users} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Como funciona a validação comunitária</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Cada ocorrência precisa de no mínimo <strong>2 validações</strong> da comunidade para sair da fila.</p>
                <p>Casos sensíveis ou com sinalização de moderação requerem até <strong>6 validações</strong>.</p>
                <p>Validadores recebem cooldown de 6 semanas após cada participação.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== PARTICIPAÇÃO ====== */}
          <TabsContent value="participacao" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi label="Reportadores únicos" value={uniqueReporters} icon={Users} />
              <Kpi label="Casos reportados" value={overview.total} icon={ListChecks} />
              <Kpi label="Validadores ativos" value={validation.totalValidations} icon={CheckCircle2} />
              <Kpi label="Engajamento" value={`${overview.resolutionRate}%`} icon={TrendingUp} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Bairros com mais participação</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byNeighborhood.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ocorrências reportadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== MAPA DE CALOR ====== */}
          <TabsContent value="heatmap" className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-destructive" /> Mapa de calor — concentração de ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Áreas com maior concentração de problemas registrados em Videira/SC.
                </p>
                <HeatmapView points={heatmapPoints} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
