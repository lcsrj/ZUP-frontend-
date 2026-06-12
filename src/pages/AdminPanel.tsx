import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rejectionReasons } from "@/data/mockData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useCategories, useNeighborhoods } from "@/hooks/useCatalog";
import { listUsers } from "@/lib/auth-api";
import { useQuery } from "@tanstack/react-query";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { Shield, Users, FileText, Settings, AlertTriangle, Eye, Trash2, MapPin, Calendar, Activity, UserCheck, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const AdminPanel = () => {
  const { roles } = useAuth();
  const { reports } = useOccurrences();
  const { categories } = useCategories();
  const { neighborhoods } = useNeighborhoods();
  const [rejReason, setRejReason] = useState("");
  const usersQ = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
    enabled: roles.includes("admin"),
    retry: 1,
  });
  if (!roles.includes("admin")) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Moderação, auditoria e gerenciamento — ZUP Videira/SC</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Ocorrências', value: reports.length, icon: FileText },
            { label: 'Usuários', value: usersQ.data?.length ?? 0, icon: Users },
            { label: 'Categorias', value: categories.length, icon: Settings },
            { label: 'Bairros', value: neighborhoods.length, icon: MapPin },
            { label: 'Suspeitas', value: 0, icon: AlertTriangle },
            { label: 'Validadores', value: 0, icon: UserCheck },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="w-7 h-7 text-primary opacity-70" />
                <div>
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="moderation">
          <TabsList className="flex-wrap">
            <TabsTrigger value="moderation">Moderação</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="neighborhoods">Bairros</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Ocorrências sinalizadas para revisão</p>
            {reports.slice(0, 4).map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex gap-3 flex-1">
                      <img src={report.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" loading="lazy" />
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{report.neighborhood}
                          <Calendar className="w-3 h-3 ml-1" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex gap-1.5">
                          <StatusBadge status={report.status} />
                          <PriorityBadge priority={report.priority} />
                          {report.isRecurrence && (
                            <span className="inline-flex items-center gap-1 text-xs text-accent font-medium">
                              <RefreshCw className="w-3 h-3" /> Reincidente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select value={rejReason} onValueChange={setRejReason}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Motivo de rejeição" /></SelectTrigger>
                        <SelectContent>
                          {rejectionReasons.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Aprovada' })}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toast({ title: 'Arquivada', description: rejReason ? `Motivo: ${rejectionReasons.find(r => r.id === rejReason)?.label}` : 'Sem motivo' })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Categorias e subcategorias — expansível pelo admin</p>
              <Button size="sm" onClick={() => toast({ title: 'Disponível com backend ativo' })}>+ Nova Categoria</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <Card key={cat.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {cat.name}
                      <span className="text-xs font-normal text-muted-foreground">{cat.subcategories.length} sub</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map(sub => (
                        <span key={sub.id} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{sub.name}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="neighborhoods" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">Bairros cadastrados de Videira/SC</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {neighborhoods.map(neighborhood => {
                const count = reports.filter(r => r.neighborhoodId === neighborhood.id).length;
                return (
                  <Card key={neighborhood.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{neighborhood.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{count} ocor.</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {usersQ.isLoading ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Carregando usuários...</p>
                ) : (usersQ.data ?? []).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhum usuário retornado pela API.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2">Nome</th>
                          <th className="text-left py-2 px-2">E-mail</th>
                          <th className="text-left py-2 px-2">Papel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(usersQ.data ?? []).map((user) => (
                          <tr key={user.id} className="border-b border-border/50">
                            <td className="py-2 px-2 font-medium">{user.name}</td>
                            <td className="py-2 px-2">{user.email}</td>
                            <td className="py-2 px-2">{user.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Trilha de auditoria ainda não é exposta por esta API.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
