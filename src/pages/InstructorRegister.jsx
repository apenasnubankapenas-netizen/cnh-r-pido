import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Upload, User, Calendar, Phone, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function InstructorRegister() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    whatsapp_link: '',
    bio: '',
    photo: '',
    cover_photo: '',
    teaches_car: false,
    teaches_moto: false,
    teaches_bus: false,
    teaches_truck: false,
    teaches_trailer: false
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [inviteMode, setInviteMode] = useState('invite'); // 'invite' | 'legacy'
  const [legacyInstructorId, setLegacyInstructorId] = useState(null);
  const [tokenValid, setTokenValid] = useState(true);
  const [showContractDialog, setShowContractDialog] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    }
  }, []);

  // Verifica sessão (sem redirecionar automaticamente para evitar loop)
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const a = await base44.auth.isAuthenticated();
        setAuthed(!!a);
      } catch {
        setAuthed(false);
      }
    })();
  }, [token]);

  const verifyToken = async (tokenValue) => {
    try {
      // 1) Novo fluxo: convites via entidade InstructorInvite
      const invites = await base44.entities.InstructorInvite.filter({ token: tokenValue, used: false });
      if (invites.length > 0) {
        setInviteMode('invite');
        setTokenValid(true);
        return;
      }
      // 2) Compatibilidade: token antigo salvo no próprio Instrutor
      const legacy = await base44.entities.Instructor.filter({ registration_token: tokenValue });
      if (legacy.length > 0) {
        setInviteMode('legacy');
        setLegacyInstructorId(legacy[0].id);
        setTokenValid(true);
        return;
      }
      // 3) Inválido/expirado
      setTokenValid(false);
    } catch (e) {
      console.log(e);
      setTokenValid(false);
    }
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const buildContractText = () => {
    const name = formData.full_name || '________________';
    const cpf = formData.cpf || '________________';
    return `CONTRATO DE PARCERIA DE INSTRUÇÃO DE AULAS PRÁTICAS DE PROCESSOS DE OBTENÇÃO DE PERMISSÃO PARA DIRIGIR/CARTEIRA NACIONAL DE HABILITAÇÃO\n\nCONTRATANTE: CENTRO DE FORMAÇÃO DE CONDUTORES AB FAMILIAR, pessoa jurídica de direito privado devidamente inscrita no CNPJ/MF sob nº 02.866.751/0001-10, com sede a AVENIDA PEDRO MONTEIRO GUIMARÃES, N 686, Bairro: CENTRO, Formosa – Goiás. CEP: 73.801-690, neste ato representado pelo sócio proprietário e administrador o Sr. WILSON AMADO DOROTEIO FILHO, brasileiro, casado, empresário, portador da Cédula de Identidade Civil de nº 1453282 – SSP/DF e inscrito no CPF/MF sob nº 646.199.661-34.\nCONTRATADO: ${name}, brasileiro, instrutor de trânsito credenciado junto ao DETRAN/GO, inscrito no CPF/MF sob nº ${cpf}.\n\nAs partes acima identificadas têm, entre si, justos e acertados o presente CONTRATO DE PARCERIA DE INSTRUÇÃO DE AULAS PRÁTICAS, PARA PROCESSOS DE OBTENÇÃO À PERMISSÃO PARA DIRIGIR/CARTEIRA NACIONAL DE HABILITAÇÃO na Circunscrição de Formosa, pelas cláusulas e condições descritas no presente instrumento.\n\nCLÁUSULA PRIMEIRA – DO OBJETO - O presente contrato tem como objeto a parceria na instrução de aulas práticas para processos de obtenção à permissão para dirigir/CNH; as aulas serão ministradas pelo CONTRATADO: ${name} aos alunos do CONTRATANTE: CENTRO DE FORMAÇÃO DE CONDUTORES AB FAMILIAR, de modo não exclusivo.\n\nDAS OBRIGAÇÕES DAS PARTES\n\nCLÁUSULA SEGUNDA – DAS OBRIGAÇÕES DO CONTRATANTE - O CONTRATANTE fica obrigado:\nI- Fornecer a listagem dos alunos agendados, conforme a grade de horários e disponibilidade do Instrutor (a) CONTRATADO;\nII- Não praticar nenhum ato que possa prejudicar a imagem e o nome do CONTRATADO e/ou seus sócios e funcionários\nIII- Cumprir fielmente todas as cláusulas do presente instrumento.\nCLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DO CONTRATADO - O CONTRATADO fica obrigado:\nI- Não praticar nenhum ato que possa prejudicar a imagem e o nome do CONTRANTE e/ou seus sócios e funcionários;\nII- Fornecer o ensino de aulas práticas aos alunos do CONTRATANTE com toda presteza e zelo necessários ao bom relacionamento com o cliente;\nIII- Enquadrar-se nos padrões e normas de conduta impostas pelas Portarias do DETRAN, CONTRAN, DENATRAN e ordenamento pátrio;\nIV- Zelar pela boa conservação dos equipamentos que estejam sob sua supervisão, uma vez caracterizado o uso indevido dos EQUIPAMENTOS, responderá pelas perdas e danos.\nV- Fornecer sua grade e disposição de horários aos funcionários do CONTRATANTE para que possa proceder ao agendamento de aulas práticas caso tenha disponibilidade de horários;\nVI- Caso, por quaisquer motivos não possa ministrar aulas já agendadas, deverá notificar e/ou avisar o CONTRATANTE antecipadamente para que não haja prejuízos aos alunos.\nVII- Entregar aos Funcionários do CONTRANTE o relatório das aulas ministradas, para que possa ser viabilizado seu pagamento.\nVIII- Podendo repassar aulas a outros contratados parceiros da contratante, afastando o caráter personalíssimo da aula, podendo também recusa-la por motivos pessoais;\nIX- Cumprir fielmente todas as cláusulas do presente instrumento.\n\nCLÁUSULA QUARTA – DAS CONDIÇÕES DE PREÇO, PAGAMENTO E RECEBIMENTO (REPASSE).\nI- Caso CONTRATANTE repasse ao CONTRATADO aulas práticas, essas serão divididas nas seguintes proporções: 85% (oitenta e cinco por cento) ao CONTRATANTE e 15% (quinze por cento) ao CONTRATADO; \nII- Combustível por conta do CONTRATANTE;\nIII- O pagamento pelo serviço prestado pelo CONTRATADO será feito ao final de cada mês concluído, de acordo com os relatórios de aulas instruídas;\nIV- O pagamento a que se referem os incisos anteriores poderá ser feito via Depósito em conta, DOC, PIX ou pessoalmente mediante preenchimento de recibo;\nCLÁUSULA QUINTA – DA RESCISÃO.\nI- O descumprimento de quaisquer cláusulas do presente contrato ensejará sua rescisão, mediante notificação extrajudicial;\nII- Fica devidamente pactuado entre as partes, que o presente contrato poderá ser dissolvido a qualquer momento mediante comunicação expressa com antecedência mínima de 30 (trinta) dias.\nCLÁUSULA SÉTIMA – DA VIGÊNCIA: O presente contrato passa a viger a partir de sua assinatura e perdura pelo prazo de 12 meses, com renovação automática atendendo requisitos subjetivos do contratante;\nCLÁUSULA OITAVA – DA LIBERALIDADE E DA RENÚNCIA: A tolerância por quaisquer das partes, no descumprimento de qualquer cláusula deste instrumento, significará mera liberalidade, não implicando em novação, renúncia ou em desistência de exigir o cumprimento fiel das disposições aqui contidas e dispostas.\nCLÁUSULA NONA – DAS FORMAS DE COMUNICAÇÃO: Todas as notificações, relatórios e outros comunicados relacionados a este contrato, quando não disposto forma diversa deveram ser procedidos e efetuados por escrito e encaminhados pessoalmente, devidamente protocolados, sendo considerados recebidos na data de sua entrega ao destinatário.\nCLÁSULA DÉCIMA – DA AUTONOMIA DAS PARTES: As partes são totalmente independentes entre si, de forma que nenhuma disposição deste contrato poderá ser interpretada no sentido de criar qualquer vínculo societário ou empregatício, bem como entre os empregados, prepostos e sócios de uma e outra parte.\nCLÁUSULA DÉCIMA PRIMEIRA – DO FORO: Fica eleito o foro da Comarca de Formosa para dirimir os litígios e quaisquer dúvidas decorrentes do presente contrato.\nE por estarem justos e contratados, firmam o presente instrumento em duas vias de igual teor na presença de duas testemunhas que juntamente o assinam.\n\nFormosa _______ de ________________________de 20____.\n\n_________________________________________________________\nCENTRO DE FORMAÇÃO DE CONDUTORES AB FAMILIAR\nCONTRATANTE\n\n\n\n________________________________________\n${name}\nCONTRATADO`; }

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (field === 'photo') setUploadingPhoto(true);
    if (field === 'cover_photo') setUploadingCover(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [field]: file_url }));
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      if (field === 'photo') setUploadingPhoto(false);
      if (field === 'cover_photo') setUploadingCover(false);
    }
  };

  const handleOpenContract = (e) => {
    e.preventDefault();
    setShowContractDialog(true);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const user = await base44.auth.me();

      if (inviteMode === 'invite') {
        const invites = await base44.entities.InstructorInvite.filter({ token, used: false });
        if (invites.length === 0) {
          alert('Link inválido ou expirado');
          setLoading(false);
          return;
        }
        await base44.entities.Instructor.create({
          ...formData,
          user_email: user.email,
          active: true,
          contract_accepted: true,
          contract_accepted_at: new Date().toISOString(),
          contract_text: buildContractText()
        });
        await base44.entities.InstructorInvite.update(invites[0].id, { used: true });
      } else if (inviteMode === 'legacy' && legacyInstructorId) {
        await base44.entities.Instructor.update(legacyInstructorId, {
          ...formData,
          user_email: user.email,
          active: true,
          registration_token: null,
          contract_accepted: true,
          contract_accepted_at: new Date().toISOString(),
          contract_text: buildContractText()
        });
      } else {
        alert('Token inválido');
        setLoading(false);
        return;
      }

      alert('Cadastro concluído com sucesso!');
      setShowContractDialog(false);
      navigate(createPageUrl('InstructorProfile'));
    } catch (error) {
      alert('Erro ao finalizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-white">Link de cadastro inválido ou expirado</p>
            <Button 
              className="mt-4"
              onClick={() => navigate(createPageUrl('Landing'))}
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Faça login para continuar</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-[#9ca3af]">Você precisa entrar para completar seu cadastro de instrutor.</p>
            <Button 
              className="w-full bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Link inválido ou expirado</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <Button className="mt-2" onClick={() => navigate(createPageUrl('Landing'))}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-3xl mx-auto py-8">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Cadastro de Instrutor</CardTitle>
            <p className="text-[#9ca3af]">Complete seu cadastro para começar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOpenContract} className="space-y-6">
              {/* Foto de Perfil */}
              <div>
                <label className="text-white font-medium mb-2 block">Foto de Perfil *</label>
                <div className="flex items-center gap-4">
                  {formData.photo && (
                    <img src={formData.photo} alt="Perfil" className="w-24 h-24 rounded-full object-cover" />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photo')}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button type="button" variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Upload className="mr-2" size={18} />
                          {uploadingPhoto ? 'Enviando...' : 'Escolher Foto'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Foto de Capa */}
              <div>
                <label className="text-white font-medium mb-2 block">Foto de Capa *</label>
                <div className="space-y-2">
                  {formData.cover_photo && (
                    <img src={formData.cover_photo} alt="Capa" className="w-full h-48 rounded-lg object-cover" />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'cover_photo')}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label htmlFor="cover-upload">
                      <Button type="button" variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <Upload className="mr-2" size={18} />
                          {uploadingCover ? 'Enviando...' : 'Escolher Capa'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="text-white font-medium mb-2 block">Nome Completo *</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  required
                />
              </div>

              {/* CPF */}
              <div>
                <label className="text-white font-medium mb-2 block">CPF *</label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="text-white font-medium mb-2 block">Data de Nascimento *</label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  required
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="text-white font-medium mb-2 block">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-white font-medium mb-2 block">Link do WhatsApp</label>
                <Input
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  placeholder="https://wa.me/..."
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-white font-medium mb-2 block">Biografia</label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="bg-[#0d1117] border-[#374151] text-white"
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              {/* Especialidades */}
              <div>
                <label className="text-white font-medium mb-2 block">Especialidades</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_car}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_car: checked})}
                    />
                    <span className="text-white">Carro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_moto}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_moto: checked})}
                    />
                    <span className="text-white">Moto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_bus}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_bus: checked})}
                    />
                    <span className="text-white">Ônibus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_truck}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_truck: checked})}
                    />
                    <span className="text-white">Caminhão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.teaches_trailer}
                      onCheckedChange={(checked) => setFormData({...formData, teaches_trailer: checked})}
                    />
                    <span className="text-white">Carreta</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#f0c41b] text-black hover:bg-[#d4aa00] font-bold"
                disabled={loading || !formData.photo || !formData.cover_photo}
              >
                {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
              </Button>
            </form>

            {/* Dialog do Contrato */}
            <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
              <DialogContent className="bg-[#1a2332] border-[#374151] max-w-3xl text-white">
                <DialogHeader>
                  <DialogTitle>Contrato de Parceria</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-relaxed">
                  {buildContractText()}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" className="border-[#374151]" onClick={() => setShowContractDialog(false)}>Não aceito</Button>
                  <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]" onClick={handleSubmit} disabled={loading}>
                    Aceitar e assinar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}