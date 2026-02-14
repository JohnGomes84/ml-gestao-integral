import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle, Users, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: riskDashboard, isLoading: loadingRisk } = trpc.workers.getRiskDashboard.useQuery();

  if (loading || loadingRisk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sistema de Gestão Operacional</CardTitle>
            <CardDescription>
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Entrar com Manus</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ML Serviços</h1>
              <p className="text-sm text-slate-600">Sistema de Gestão Operacional</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Olá, <strong>{user?.name}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Radar de Risco */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            🎯 Radar de Risco Trabalhista
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total de Trabalhadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {riskDashboard?.total || 0}
                </div>
              </CardContent>
            </Card>

            {/* Baixo Risco */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Risco Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {riskDashboard?.lowRisk || 0}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {riskDashboard?.total
                    ? Math.round(((riskDashboard.lowRisk || 0) / riskDashboard.total) * 100)
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>

            {/* Médio Risco */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risco Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-700">
                  {riskDashboard?.mediumRisk || 0}
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  {riskDashboard?.total
                    ? Math.round(((riskDashboard.mediumRisk || 0) / riskDashboard.total) * 100)
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>

            {/* Alto Risco */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Risco Alto/Crítico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">
                  {(riskDashboard?.highRisk || 0) + (riskDashboard?.criticalRisk || 0)}
                </div>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Requer atenção imediata
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {riskDashboard && (riskDashboard.highRisk > 0 || riskDashboard.criticalRisk > 0) && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Atenção: {riskDashboard.highRisk + riskDashboard.criticalRisk} trabalhador(es) em risco alto
                </CardTitle>
                <CardDescription className="text-red-600">
                  Estes trabalhadores podem caracterizar vínculo empregatício. Implemente rodízio imediatamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskDashboard.highRiskWorkers.slice(0, 3).map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{worker.fullName}</p>
                        <p className="text-sm text-slate-600">
                          Score de risco: <strong>{worker.riskScore}</strong> ({worker.riskLevel})
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/trabalhadores/${worker.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  ))}
                </div>
                {riskDashboard.highRiskWorkers.length > 3 && (
                  <Button asChild variant="link" className="mt-4 text-red-700">
                    <Link href="/trabalhadores">
                      Ver todos os {riskDashboard.highRiskWorkers.length} trabalhadores em risco →
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Ações Rápidas */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900">⚡ Ações Rápidas</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/trabalhadores">
                <CardHeader>
                  <CardTitle className="text-base">👥 Gerenciar Trabalhadores</CardTitle>
                  <CardDescription>
                    Cadastrar, editar e visualizar trabalhadores
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/alocacoes">
                <CardHeader>
                  <CardTitle className="text-base">📅 Criar Alocação</CardTitle>
                  <CardDescription>
                    Alocar trabalhadores com sugestões inteligentes
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/clientes">
                <CardHeader>
                  <CardTitle className="text-base">🏢 Gerenciar Clientes</CardTitle>
                  <CardDescription>
                    Cadastrar clientes e locais de trabalho
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/contratos">
                <CardHeader>
                  <CardTitle className="text-base">📝 Gerenciar Contratos</CardTitle>
                  <CardDescription>
                    Parametrizar valores e benefícios por cliente
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/turnos">
                <CardHeader>
                  <CardTitle className="text-base">🕐 Gerenciar Turnos</CardTitle>
                  <CardDescription>
                    Configurar turnos personalizados por cliente
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-green-50 border-green-200">
              <Link href="/relatorios/quinzenal">
                <CardHeader>
                  <CardTitle className="text-base">📊 Relatório Quinzenal</CardTitle>
                  <CardDescription>
                    Pessoas-dia por cliente para faturamento
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-blue-50 border-blue-200">
              <Link href="/supervisor">
                <CardHeader>
                  <CardTitle className="text-base">📱 Supervisor (Mobile)</CardTitle>
                  <CardDescription>
                    Confirmar presença e registrar entrada/saída
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-purple-50 border-purple-200">
              <Link href="/conformidade">
                <CardHeader>
                  <CardTitle className="text-base">🛡️ Controle de Conformidade</CardTitle>
                  <CardDescription>
                    Gestão de bloqueios e conformidade trabalhista
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-orange-50 border-orange-200">
              <Link href="/trabalhadores-pendentes">
                <CardHeader>
                  <CardTitle className="text-base">✅ Cadastros Pendentes</CardTitle>
                  <CardDescription>
                    Aprovar ou rejeitar cadastros de trabalhadores
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-red-50 border-red-200">
              <Link href="/riscos">
                <CardHeader>
                  <CardTitle className="text-base">⚠️ Dashboard de Riscos</CardTitle>
                  <CardDescription>
                    Trabalhadores em situação de risco trabalhista
                  </CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

