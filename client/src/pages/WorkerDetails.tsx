import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Calendar, FileText, AlertCircle } from "lucide-react";

export default function WorkerDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const workerId = parseInt(params.id || "0");

  const { data: worker, isLoading } = trpc.workers.getById.useQuery({ id: workerId });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg">Trabalhador não encontrado</p>
              <Button onClick={() => setLocation("/trabalhadores")}>
                Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/trabalhadores")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Main Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{worker.fullName}</CardTitle>
                <p className="text-muted-foreground">{worker.workerType}</p>
              </div>
            </div>
            <Badge variant={worker.status === "active" ? "default" : "secondary"}>
              {worker.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Telefone:</strong> {worker.phone}</p>
                {worker.email && <p><strong>Email:</strong> {worker.email}</p>}
                <p><strong>CPF:</strong> {worker.cpf}</p>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Informações Financeiras
              </h3>
              <div className="space-y-2 text-sm">
                {worker.dailyRate && (
                  <p><strong>Diária:</strong> R$ {parseFloat(worker.dailyRate).toFixed(2)}</p>
                )}
                {worker.pixKey && (
                  <p><strong>Chave PIX:</strong> {worker.pixKey}</p>
                )}
              </div>
            </div>

            {/* Address */}
            {worker.street && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="space-y-2 text-sm">
                  <p>{worker.street}, {worker.number}</p>
                  {worker.complement && <p>{worker.complement}</p>}
                  {worker.neighborhood && <p>{worker.neighborhood}</p>}
                  {worker.city && worker.state && (
                    <p>{worker.city} - {worker.state}</p>
                  )}
                  {worker.zipCode && <p>CEP: {worker.zipCode}</p>}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações Adicionais
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Tipo:</strong> {worker.workerType}</p>
                {worker.createdAt && (
                  <p><strong>Cadastrado em:</strong> {new Date(worker.createdAt).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Indicador de Risco Trabalhista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge 
              variant={
                worker.riskLevel === "high" || worker.riskLevel === "critical" 
                  ? "destructive" 
                  : worker.riskLevel === "medium" 
                  ? "default" 
                  : "secondary"
              }
              className="text-lg px-4 py-2"
            >
              {worker.riskLevel === "low" && "Baixo"}
              {worker.riskLevel === "medium" && "Médio"}
              {worker.riskLevel === "high" && "Alto"}
              {worker.riskLevel === "critical" && "Crítico"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Baseado em {worker.riskScore || 0} dias consecutivos
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
