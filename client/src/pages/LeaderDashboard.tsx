// @ts-nocheck
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function LeaderDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Buscar operações do líder
  const { data: operations, isLoading } = trpc.operations.listByLeader.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">
              Você precisa estar logado como líder para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando operações...</p>
      </div>
    );
  }

  // Filtrar operações por status
  const filteredOperations =
    operations?.filter(op => {
      if (selectedStatus === "all") return true;
      return op.status === selectedStatus;
    }) || [];

  // Estatísticas
  const stats = {
    total: operations?.length || 0,
    pending:
      operations?.filter(
        op => op.status === "pending_accept" || op.status === "created"
      ).length || 0,
    inProgress:
      operations?.filter(op => op.status === "in_progress").length || 0,
    completed: operations?.filter(op => op.status === "completed").length || 0,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "secondary", label: "Pendente" },
      in_progress: { variant: "default", label: "Em Andamento" },
      completed: { variant: "outline", label: "Concluída" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-4 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard do Líder</h1>
        <p className="text-muted-foreground">Olá, {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.inProgress}
              </p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus("all")}
        >
          Todas
        </Button>
        <Button
          variant={selectedStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus("pending")}
        >
          Pendentes
        </Button>
        <Button
          variant={selectedStatus === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus("in_progress")}
        >
          Em Andamento
        </Button>
        <Button
          variant={selectedStatus === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus("completed")}
        >
          Concluídas
        </Button>
      </div>

      {/* Operations List */}
      <div className="space-y-4">
        {filteredOperations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Nenhuma operação encontrada.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOperations.map(operation => (
            <Card
              key={operation.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {operation.clientName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {operation.locationName}
                    </p>
                  </div>
                  {getStatusBadge(operation.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Date and Shift */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(operation.workDate).toLocaleDateString("pt-BR")}
                    </span>
                    <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                    <span>{operation.shiftName || "Sem turno"}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Ver no mapa</span>
                  </div>

                  {/* Team Size */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{operation.totalWorkers || 0} trabalhador(es)</span>
                  </div>

                  {/* Status Info */}
                  {(operation.status === "pending_accept" ||
                    operation.status === "created") && (
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Aguardando aceite dos trabalhadores</span>
                    </div>
                  )}
                  {operation.status === "in_progress" && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Clock className="h-4 w-4" />
                      <span>Operação em andamento</span>
                    </div>
                  )}
                  {operation.status === "completed" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Operação concluída</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full mt-2"
                    onClick={() =>
                      setLocation(`/lider/operacao/${operation.id}`)
                    }
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
