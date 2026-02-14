import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Upload, AlertCircle, Loader2 } from "lucide-react";
// Storage will be handled via API call to avoid exposing S3 credentials in frontend

export default function WorkerRegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    dateOfBirth: "",
    motherName: "",
    phone: "",
    email: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    pixKey: "",
    pixKeyType: "cpf" as "cpf" | "cnpj" | "email" | "phone" | "random",
    documentType: "rg" as "rg" | "cnh" | "rne",
    workerType: "daily" as "daily" | "freelancer" | "mei" | "clt",
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMutation = trpc.workerRegistration.register.useMutation();
  const uploadMutation = trpc.workerRegistration.uploadDocument.useMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 5MB");
        return;
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        setError("O arquivo deve ser uma imagem");
        return;
      }

      setDocumentFile(file);
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCpf.charAt(10))) return false;
    
    return true;
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!validateCPF(formData.cpf)) {
      setError("CPF inválido");
      return;
    }

    const age = calculateAge(formData.dateOfBirth);
    if (age < 18) {
      setError("Cadastro não permitido para menores de 18 anos");
      return;
    }

    if (!documentFile) {
      setError("É obrigatório enviar uma foto do documento");
      return;
    }

    try {
      setUploading(true);

      // Upload do documento via API
      const fileExtension = documentFile.name.split('.').pop();
      const fileName = `${formData.cpf.replace(/\D/g, '')}-${Date.now()}.${fileExtension}`;
      
      // Converter arquivo para base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(documentFile);
      });
      
      // Upload via tRPC
      const { url: documentUrl } = await uploadMutation.mutateAsync({
        fileName,
        fileData,
        mimeType: documentFile.type,
      });

      // Registrar trabalhador
      await registerMutation.mutateAsync({
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        documentPhotoUrl: documentUrl,
      });

      setSuccess(true);
      setUploading(false);
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar. Tente novamente.");
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Cadastro Enviado com Sucesso!
              </h2>
              <p className="text-slate-600">
                Seu cadastro foi recebido e está em análise. Você será notificado assim que for aprovado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Cadastro de Trabalhador</CardTitle>
            <CardDescription>
              Preencha todos os campos para se cadastrar. Seu cadastro será analisado pela empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          if (value.length > 9) {
                            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                          } else if (value.length > 6) {
                            value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                          } else if (value.length > 3) {
                            value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                          }
                          handleInputChange("cpf", value);
                        }
                      }}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="motherName">Nome da Mãe *</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) => handleInputChange("motherName", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Contato</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Endereço</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => handleInputChange("number", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => handleInputChange("complement", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="SP"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="00000-000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Chave PIX */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Dados de Pagamento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pixKeyType">Tipo de Chave PIX *</Label>
                    <Select
                      value={formData.pixKeyType}
                      onValueChange={(value: any) => handleInputChange("pixKeyType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="pixKey">Chave PIX *</Label>
                    <Input
                      id="pixKey"
                      value={formData.pixKey}
                      onChange={(e) => handleInputChange("pixKey", e.target.value)}
                      placeholder="Digite sua chave PIX"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Documento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Documento com Foto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="documentType">Tipo de Documento *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value: any) => handleInputChange("documentType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rg">RG</SelectItem>
                        <SelectItem value="cnh">CNH</SelectItem>
                        <SelectItem value="rne">RNE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workerType">Tipo de Contrato *</Label>
                    <Select
                      value={formData.workerType}
                      onValueChange={(value: any) => handleInputChange("workerType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diarista</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                        <SelectItem value="clt">CLT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="documentFile">Foto do Documento *</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="documentFile"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {documentPreview ? (
                        <img
                          src={documentPreview}
                          alt="Preview"
                          className="h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-600">
                            Clique para enviar foto do documento
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            PNG, JPG até 5MB
                          </span>
                        </div>
                      )}
                    </label>
                    <input
                      id="documentFile"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Cadastro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
