// @ts-nocheck
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

export default function RiskDashboard() {
  const { data: risks, isLoading: risksLoading } =
    trpc.compliance.calculateRisks.useQuery();
  const { data: stats, isLoading: statsLoading } =
    trpc.compliance.getRiskStats.useQuery();

  if (risksLoading || statsLoading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">
          Carregando dashboard de riscos...
        </p>
      </div>
    );
  }

  const criticalRisks = risks?.filter(r => r.riskLevel === "critical") || [];
  const highRisks = risks?.filter(r => r.riskLevel === "high") || [];
  const mediumRisks = risks?.filter(r => r.riskLevel === "medium") || [];

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "high":
        return <Badge className="bg-orange-500">Alto</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Médio</Badge>;
      default:
        return <Badge variant="outline">Baixo</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              Radar de Risco Trabalhista
            </h1>
          </div>
          <p className="text-muted-foreground">
            Monitoramento de conformidade e exposição financeira
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Trabalhadores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalWorkers || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Risco Alto/Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(stats?.criticalRisk || 0) + (stats?.highRisk || 0)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.mediumRisk || 0}
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Monitoramento necessário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Exposição Financeira
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalFinancialExposure || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Risk Workers */}
      {criticalRisks.length > 0 && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Trabalhadores em Risco Crítico ({criticalRisks.length})
            </CardTitle>
            <CardDescription>
              Ação imediata necessária - Alto risco de caracterização de vínculo
              empregatício
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalRisks.map(worker => (
                <div
                  key={worker.workerId}
                  className="flex items-center justify-between p-4 border rounded-lg bg-red-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{worker.workerName}</p>
                      {getRiskBadge(worker.riskLevel)}
                      {worker.isBlocked && (
                        <Badge variant="outline" className="bg-gray-100">
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>CPF: {worker.workerCpf}</span>
                      <span>
                        • {worker.maxConsecutiveDays} dias consecutivos
                      </span>
                      <span>
                        • {worker.totalDaysWorked} dias trabalhados (30d)
                      </span>
                      <span>• Score autonomia: {worker.autonomyScore}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium text-red-600">
                      Exposição: {formatCurrency(worker.financialExposure)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score de risco: {worker.riskScore}/100
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Risk Workers */}
      {highRisks.length > 0 && (
        <Card className="border-orange-300">
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Trabalhadores em Risco Alto ({highRisks.length})
            </CardTitle>
            <CardDescription>
              Monitoramento próximo necessário - Risco elevado de problemas
              trabalhistas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRisks.map(worker => (
                <div
                  key={worker.workerId}
                  className="flex items-center justify-between p-4 border rounded-lg bg-orange-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{worker.workerName}</p>
                      {getRiskBadge(worker.riskLevel)}
                      {worker.isBlocked && (
                        <Badge variant="outline" className="bg-gray-100">
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>CPF: {worker.workerCpf}</span>
                      <span>
                        • {worker.maxConsecutiveDays} dias consecutivos
                      </span>
                      <span>
                        • {worker.totalDaysWorked} dias trabalhados (30d)
                      </span>
                      <span>• Score autonomia: {worker.autonomyScore}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium text-orange-600">
                      Exposição: {formatCurrency(worker.financialExposure)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score de risco: {worker.riskScore}/100
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medium Risk Workers */}
      {mediumRisks.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trabalhadores em Risco Médio ({mediumRisks.length})
            </CardTitle>
            <CardDescription>
              Monitoramento regular - Situação controlada mas requer atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mediumRisks.slice(0, 5).map(worker => (
                <div
                  key={worker.workerId}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{worker.workerName}</p>
                      {getRiskBadge(worker.riskLevel)}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>CPF: {worker.workerCpf}</span>
                      <span>
                        • {worker.maxConsecutiveDays} dias consecutivos
                      </span>
                      <span>
                        • {worker.totalDaysWorked} dias trabalhados (30d)
                      </span>
                      <span>• Score autonomia: {worker.autonomyScore}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium text-yellow-600">
                      Exposição: {formatCurrency(worker.financialExposure)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score de risco: {worker.riskScore}/100
                    </p>
                  </div>
                </div>
              ))}
              {mediumRisks.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {mediumRisks.length - 5} trabalhadores adicionais em risco
                  médio
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Risks */}
      {risks && risks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum trabalhador em situação de risco identificado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
