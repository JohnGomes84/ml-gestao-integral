import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function OperationAccept() {
  const params = useParams<{ memberId: string }>();
  const [, setLocation] = useLocation();
  const memberId = parseInt(params.memberId || "0");

  const [cpf, setCpf] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const acceptMutation = trpc.operations.accept.useMutation({
    onSuccess: () => {
      toast.success("Operação aceita com sucesso!");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao aceitar operação");
    },
  });

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    // Format CPF: 000.000.000-00
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    
    setCpf(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpf) {
      toast.error("Por favor, informe seu CPF");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    // Get IP from browser (will be validated on server)
    acceptMutation.mutate({ memberId, cpf: cleanCpf, ip: "browser" });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Aceite de Operação
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Confirme sua participação nesta operação
          </p>
        </CardHeader>
        <CardContent>
          {acceptMutation.isSuccess ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Operação aceita com sucesso! Você será redirecionado...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CPF Input */}
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Digite seu CPF para confirmar sua identidade
                </p>
              </div>

              {/* Terms Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Termo de Aceite e Responsabilidade
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTerms(!showTerms)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {showTerms ? "Ocultar" : "Ler Termo"}
                  </Button>
                </div>

                {showTerms && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-4 text-sm">
                        <h3 className="font-semibold">TERMO DE ACEITE DE PRESTAÇÃO DE SERVIÇO AUTÔNOMO</h3>
                        
                        <p>
                          Eu, identificado(a) pelo CPF informado acima, declaro que:
                        </p>

                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          <li>
                            <strong>Autonomia:</strong> Aceito livremente esta oportunidade de trabalho, sem qualquer vínculo empregatício, 
                            subordinação ou obrigatoriedade de comparecimento.
                          </li>
                          <li>
                            <strong>Liberdade de Recusa:</strong> Tenho plena liberdade para recusar este ou qualquer outro trabalho, 
                            sem qualquer penalidade ou prejuízo.
                          </li>
                          <li>
                            <strong>Prestação de Serviço:</strong> Comprometo-me a comparecer no local, data e horário indicados, 
                            executando as atividades conforme orientações recebidas.
                          </li>
                          <li>
                            <strong>Pagamento:</strong> Estou ciente do valor da diária e forma de pagamento acordados.
                          </li>
                          <li>
                            <strong>Responsabilidade:</strong> Assumo total responsabilidade por minha segurança e bem-estar durante 
                            a execução do serviço, utilizando corretamente os EPIs fornecidos.
                          </li>
                          <li>
                            <strong>Documentação:</strong> Declaro que todos os dados fornecidos são verdadeiros e que possuo 
                            capacidade legal para exercer a atividade.
                          </li>
                          <li>
                            <strong>Conformidade Legal:</strong> Estou ciente de que esta prestação de serviço está em conformidade 
                            com a legislação trabalhista vigente, respeitando os limites de dias consecutivos e demais requisitos legais.
                          </li>
                        </ol>

                        <p className="text-xs text-muted-foreground mt-4">
                          Data e hora do aceite: {new Date().toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Checkbox */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Li e aceito os termos acima. Confirmo que estou ciente de meus direitos e responsabilidades 
                    como prestador de serviço autônomo.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!cpf || !acceptedTerms || acceptMutation.isPending}
              >
                {acceptMutation.isPending ? "Processando..." : "Confirmar Aceite"}
              </Button>

              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ao confirmar, você estará formalmente aceitando participar desta operação. 
                  Seu CPF será validado e o aceite será registrado com data e hora.
                </AlertDescription>
              </Alert>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
