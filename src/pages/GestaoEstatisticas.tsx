import { useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, isInstitutional } from "@/hooks/useAuth";
import { organConfig } from "@/data/organConfig";
import { useOccurrences } from "@/hooks/useOccurrences";
import {
  ShieldCheck, BarChart3, ArrowLeft, Loader2, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, MapPin, Timer, Percent, RefreshCw, ListChecks
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const COLORS = ['#7C3AED', '#0D9488', '#EAB308', '#EF4444', '#22C55E', '#A855F7', '#F97316', '#0EA5E9'];

const GestaoEstatisticas = () => {
  const { user, roles, organ, loading } = useAuth();
  const { reports: allOccurrences } = useOccurrences();
  const isAdmin = roles.includes("admin");
  const targetOrgan = organ ?? "prefeitura";

  const reports = useMemo(() => {
    if (!user) return [];
    return isAdmin ? allOccurrences : allOccurrences.filter(r => r.organ === targetOrgan);
  }, [user, isAdmin, targetOrgan, allOccurrences]);

  const kpis = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => ["aguardando_validacao", "em_analise"].includes(r.status)).length;
    const inProgress = reports.filter(r => r.status === "em_execucao").length;
    const resolved = reports.filter(r => ["resolvido", "resolucao_validada"].includes(r.status)).length;
    const rejected = reports.filter(r => r.status === "resolucao_rejeitada").length;
    const critical = reports.filter(r => r.priority === "critica").length;
    const recurrent = reports.filter(r => r.isRecurrence).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const recurrenceRate = total > 0 ? Math.round((recurrent / total) * 100) : 0;
    return { total, pending, inProgress, resolved, rejected, critical, recurrent, resolutionRate, recurrenceRate };
  }, [reports]);

  const byNeighborhood = useMemo(() => {
    const map = new Map<string, { name: string; total: number; resolved: number; pending: number }>();
    reports.forEach(r => {
      const cur = map.get(r.neighborhood) ?? { name: r.neighborhood, total: 0, resolved: 0, pending: 0 };
      cur.total += 1;
      if (["resolvido", "resolucao_validada"].includes(r.status)) cur.resolved += 1;
      else cur.pending += 1;
      map.set(r.neighborhood, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [reports]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach(r => {
      const name = r.categoryName ?? r.categoryId;
      map.set(name, (map.get(name) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reports]);

  const byStatus = useMemo(() => {
    const labels: Record<string, { name: string; color: string }> = {
      aguardando_validacao: { name: "Aguardando", color: "#A855F7" },
      em_analise: { name: "Em Análise", color: "#EAB308" },
      em_execucao: { name: "Em Execução", color: "#0D9488" },
      resolvido: { name: "Resolvido", color: "#22C55E" },
      resolucao_validada: { name: "Validada", color: "#16A34A" },
      resolucao_rejeitada: { name: "Rejeitada", color: "#EF4444" },
    };
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k]?.name ?? k, value: v, color: labels[k]?.color ?? "#999" }));
  }, [reports]);

  const byPriority = useMemo(() => {
    const labels: Record<string, { name: string; color: string }> = {
      critica: { name: "Crítica", color: "hsl(0, 84%, 60%)" },
      alta: { name: "Alta", color: "hsl(25, 95%, 53%)" },
      media: { name: "Média", color: "hsl(45, 100%, 51%)" },
      baixa: { name: "Baixa", color: "hsl(210, 14%, 70%)" },
    };
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.priority] = (counts[r.priority] ?? 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k].name, value: v, color: labels[k].color }));
  }, [reports]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/gestao/login" replace />;
  if (!isInstitutional(roles)) return <Navigate to="/gestao/login" state={{ reason: "no_access" }} replace />;

  const meta = organConfig[targetOrgan];
  const scopeLabel = isAdmin ? "todas as gestões" : meta.shortName;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <ShieldCheck className="w-3 h-3 mr-1" /> Estatísticas da Gestão
              </Badge>
              {isAdmin && <Badge variant="secondary">Administrador</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Estatísticas</h1>
            <p className="text-muted-foreground mt-1">Indicadores de desempenho — escopo: {scopeLabel}</p>
          </div>
          <Link to="/gestao">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar à fila
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: kpis.total, icon: ListChecks, tone: "text-primary" },
            { label: "Pendentes", value: kpis.pending, icon: Clock, tone: "text-[hsl(var(--status-awaiting))]" },
            { label: "Em execução", value: kpis.inProgress, icon: TrendingUp, tone: "text-[hsl(var(--status-execution))]" },
            { label: "Resolvidas", value: kpis.resolved, icon: CheckCircle2, tone: "text-[hsl(var(--status-validated))]" },
            { label: "Rejeitadas", value: kpis.rejected, icon: AlertTriangle, tone: "text-destructive" },
            { label: "Críticas", value: kpis.critical, icon: AlertTriangle, tone: "text-destructive" },
            { label: "Resolução", value: `${kpis.resolutionRate}%`, icon: Percent, tone: "text-[hsl(var(--status-validated))]" },
            { label: "Reincidência", value: `${kpis.recurrenceRate}%`, icon: RefreshCw, tone: "text-accent" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className={`flex items-center gap-2 text-xs mb-1 ${s.tone}`}>
                  <s.icon className="w-3.5 h-3.5" /> {s.label}
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="neighborhoods">Por bairro</TabsTrigger>
            <TabsTrigger value="categories">Por categoria</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Por status</CardTitle>
                  <CardDescription>Distribuição atual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                        {byStatus.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Por prioridade</CardTitle>
                  <CardDescription>Severidade das ocorrências</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byPriority} dataKey="value" nameKey="name" outerRadius={90} label>
                        {byPriority.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4" /> Indicadores operacionais</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tempo médio de resolução</p>
                  <p className="text-xl font-bold">—</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">1ª resposta média</p>
                  <p className="text-xl font-bold">—</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Em aberto há</p>
                  <p className="text-xl font-bold">—</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reincidências</p>
                  <p className="text-xl font-bold">{kpis.recurrent}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEIGHBORHOODS */}
          <TabsContent value="neighborhoods" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Ocorrências por bairro</CardTitle>
                <CardDescription>Total, resolvidas e pendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(280, byNeighborhood.length * 28)}>
                  <BarChart data={byNeighborhood} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolved" stackId="a" fill="#22C55E" name="Resolvidas" />
                    <Bar dataKey="pending" stackId="a" fill="#EAB308" name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7C3AED" name="Ocorrências" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={100} label>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TRENDS */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Evolução mensal</CardTitle>
                <CardDescription>Total, resolvidas e em aberto</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#7C3AED" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="resolved" stroke="#22C55E" strokeWidth={2} name="Resolvidas" />
                    <Line type="monotone" dataKey="unresolved" stroke="#EAB308" strokeWidth={2} name="Em aberto" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GestaoEstatisticas;
