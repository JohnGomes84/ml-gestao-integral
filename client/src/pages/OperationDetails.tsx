// @ts-nocheck
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Utensils,
  HardHat,
  Play,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function OperationDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const operationId = parseInt(params.id || "0");

  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<
    | "absence"
    | "late_arrival"
    | "early_departure"
    | "misconduct"
    | "accident"
    | "equipment_issue"
    | "quality_issue"
    | "other"
    | ""
  >("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentPhoto, setIncidentPhoto] = useState<File | null>(null);

  // Queries
  const {
    data: operation,
    isLoading,
    refetch,
  } = trpc.operations.getById.useQuery(
    { id: operationId },
    { enabled: !!operationId }
  );

  const { data: incidents } = trpc.operations.listIncidents.useQuery(
    { operationId },
    { enabled: !!operationId }
  );

  // Mutations
  const startMutation = trpc.operations.start.useMutation({
    onSuccess: () => {
      toast.success("Operação iniciada!");
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const checkInMutation = trpc.operations.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Check-in realizado!");
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const checkOutMutation = trpc.operations.checkOut.useMutation({
    onSuccess: () => {
      toast.success("Check-out realizado!");
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const completeMutation = trpc.operations.complete.useMutation({
    onSuccess: () => {
      toast.success("Operação concluída!");
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const createIncidentMutation = trpc.operations.createIncident.useMutation({
    onSuccess: () => {
      toast.success("Ocorrência registrada!");
      setIncidentDialogOpen(false);
      setIncidentType("");
      setIncidentDescription("");
      setIncidentPhoto(null);
      refetch();
    },
    onError: error => toast.error(error.message),
  });

  const uploadMutation = trpc.workerRegistration.uploadDocument.useMutation();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando operação...</p>
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Operação não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartOperation = () => {
    startMutation.mutate({ operationId });
  };

  const handleCheckIn = (memberId: number) => {
    checkInMutation.mutate({ memberId });
  };

  const handleCheckOut = (
    memberId: number,
    tookMeal: boolean,
    usedEpi: boolean
  ) => {
    checkOutMutation.mutate({ memberId, tookMeal, usedEpi });
  };

  const handleCompleteOperation = () => {
    if (confirm("Tem certeza que deseja concluir esta operação?")) {
      completeMutation.mutate({ operationId });
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!incidentType || !incidentDescription) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    let photoUrl = "";
    if (incidentPhoto) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(incidentPhoto);
        });

        const uploadResult = await uploadMutation.mutateAsync({
          fileName: incidentPhoto.name,
          mimeType: incidentPhoto.type,
          fileData: base64.split(",")[1],
        });

        photoUrl = uploadResult.url;
      } catch (error) {
        toast.error("Erro ao fazer upload da foto");
        return;
      }
    }

    createIncidentMutation.mutate({
      operationId,
      incidentType: incidentType as
        | "absence"
        | "late_arrival"
        | "early_departure"
        | "misconduct"
        | "accident"
        | "equipment_issue"
        | "quality_issue"
        | "other",
      severity: "medium",
      description: incidentDescription,
      photos: photoUrl || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      created: { variant: "secondary", label: "Criada" },
      pending_accept: { variant: "secondary", label: "Aguardando Aceite" },
      accepted: { variant: "default", label: "Aceita" },
      in_progress: { variant: "default", label: "Em Andamento" },
      completed: { variant: "outline", label: "Concluída" },
      billed: { variant: "outline", label: "Faturada" },
    };
    const config = variants[status] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canStart =
    operation.status === "accepted" || operation.status === "pending_accept";
  const canCheckInOut = operation.status === "in_progress";
  const canComplete = operation.status === "in_progress";

  return (
    <div className="container mx-auto py-4 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/lider/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{operation.operationName}</h1>
            <p className="text-muted-foreground">Operação #{operation.id}</p>
          </div>
          {getStatusBadge(operation.status)}
        </div>
      </div>

      {/* Operation Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações da Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(operation.workDate).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Turno #{operation.shiftId || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Local #{operation.locationId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{operation.totalWorkers || 0} trabalhador(es)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canStart && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <Button
              onClick={handleStartOperation}
              disabled={startMutation.isPending}
              className="w-full"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Iniciar Operação
            </Button>
          </CardContent>
        </Card>
      )}

      {canComplete && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <Button
              onClick={handleCompleteOperation}
              disabled={completeMutation.isPending}
              className="w-full"
              size="lg"
              variant="default"
            >
              <CheckCheck className="h-5 w-5 mr-2" />
              Concluir Operação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {operation.members && operation.members.length > 0 ? (
              operation.members.map((member: any) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold">{member.workerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.jobFunction}
                        </p>
                        <p className="text-sm">
                          Diária: R$ {member.dailyRate?.toFixed(2)}
                        </p>
                      </div>
                      <Badge
                        variant={member.acceptedAt ? "default" : "secondary"}
                      >
                        {member.acceptedAt ? "Aceito" : "Pendente"}
                      </Badge>
                    </div>

                    {canCheckInOut && member.acceptedAt && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={member.checkedInAt ? "outline" : "default"}
                          onClick={() => handleCheckIn(member.id)}
                          disabled={
                            !!member.checkedInAt || checkInMutation.isPending
                          }
                        >
                          {member.checkedInAt ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Check-in:{" "}
                              {new Date(member.checkedInAt).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </>
                          ) : (
                            "Check-in"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant={member.checkedOutAt ? "outline" : "default"}
                          onClick={() => {
                            const mealCheckbox = document.getElementById(
                              `meal-${member.id}`
                            ) as HTMLInputElement;
                            const epiCheckbox = document.getElementById(
                              `epi-${member.id}`
                            ) as HTMLInputElement;
                            handleCheckOut(
                              member.id,
                              mealCheckbox?.checked || false,
                              epiCheckbox?.checked || false
                            );
                          }}
                          disabled={
                            !member.checkedInAt ||
                            !!member.checkedOutAt ||
                            checkOutMutation.isPending
                          }
                        >
                          {member.checkedOutAt ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Check-out:{" "}
                              {new Date(member.checkedOutAt).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </>
                          ) : (
                            "Check-out"
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Consumption Controls */}
                    {canCheckInOut &&
                      member.checkedInAt &&
                      !member.checkedOutAt && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold">
                            Antes do check-out:
                          </p>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                id={`meal-${member.id}`}
                                className="rounded"
                              />
                              <Utensils className="h-4 w-4" />
                              Forneceu marmita
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                id={`epi-${member.id}`}
                                className="rounded"
                              />
                              <HardHat className="h-4 w-4" />
                              Forneceu EPI
                            </label>
                          </div>
                        </div>
                      )}

                    {member.checkedOutAt && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Utensils className="h-4 w-4" />
                          <span>
                            Marmita: {member.mealProvided ? "Sim" : "Não"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <HardHat className="h-4 w-4" />
                          <span>EPI: {member.epiProvided ? "Sim" : "Não"}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">
                Nenhum membro na equipe
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Incidents */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ocorrências</CardTitle>
            {canCheckInOut && (
              <Dialog
                open={incidentDialogOpen}
                onOpenChange={setIncidentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Registrar Ocorrência
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Ocorrência</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitIncident} className="space-y-4">
                    <div>
                      <Label htmlFor="incidentType">Tipo *</Label>
                      <Select
                        value={incidentType}
                        onValueChange={value => setIncidentType(value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="absence">Falta</SelectItem>
                          <SelectItem value="late_arrival">Atraso</SelectItem>
                          <SelectItem value="early_departure">
                            Saída Antecipada
                          </SelectItem>
                          <SelectItem value="misconduct">
                            Conduta Inadequada
                          </SelectItem>
                          <SelectItem value="accident">Acidente</SelectItem>
                          <SelectItem value="equipment_issue">
                            Problema com Equipamento
                          </SelectItem>
                          <SelectItem value="quality_issue">
                            Problema de Qualidade
                          </SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={incidentDescription}
                        onChange={e => setIncidentDescription(e.target.value)}
                        placeholder="Descreva o que aconteceu..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="photo">Foto (opcional)</Label>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={e =>
                          setIncidentPhoto(e.target.files?.[0] || null)
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createIncidentMutation.isPending}
                    >
                      {createIncidentMutation.isPending
                        ? "Salvando..."
                        : "Registrar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {incidents && incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.map((incident: any) => (
                <Card key={incident.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{incident.incidentType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(incident.createdAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                        <p className="text-sm">{incident.description}</p>
                        {incident.photoUrl && (
                          <img
                            src={incident.photoUrl}
                            alt="Foto da ocorrência"
                            className="mt-2 rounded max-w-xs"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Nenhuma ocorrência registrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
