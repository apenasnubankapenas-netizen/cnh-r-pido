import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  Car, 
  Bike, 
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  Plus,
  Minus,
  Bus,
  Truck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export default function StudentRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);

  const [formData, setFormData] = useState({
    renach: '',
    cpf: '',
    full_name: '',
    cep: '',
    whatsapp: '',
    phone: '',
    category: '',
    has_cnh: null,
    cnh_front_photo: '',
    cnh_back_photo: '',
    extra_car_lessons: 0,
    extra_moto_lessons: 0,
    theoretical_course: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const instructorMatches = currentUser?.email ? await base44.entities.Instructor.filter({ user_email: currentUser.email }) : [];
      if (instructorMatches.length > 0) {
        setIsInstructor(true);
      }
      
      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (e) {
      console.log(e);
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

  const formatCEP = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData({ ...formData, [field]: file_url });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const calculateTotal = () => {
    if (!settings) return 0;
    
    let total = 0;
    const lessonPrice = settings.lesson_price || 98;
    
    if (formData.category === 'A') {
      total = settings.category_a_price || 548;
      total += formData.extra_moto_lessons * lessonPrice;
    } else if (formData.category === 'B') {
      total = settings.category_b_price || 548;
      total += formData.extra_car_lessons * lessonPrice;
    } else if (formData.category === 'AB') {
      total = settings.category_ab_price || 992;
      total += formData.extra_car_lessons * lessonPrice;
      total += formData.extra_moto_lessons * lessonPrice;
    } else if (['inclusao_A', 'inclusao_B'].includes(formData.category)) {
      total = settings.category_a_price || 548;
      total += formData.extra_car_lessons * lessonPrice;
      total += formData.extra_moto_lessons * lessonPrice;
    } else if (['onibus', 'carreta'].includes(formData.category)) {
      total = settings.category_b_price || 548;
      total += formData.extra_car_lessons * lessonPrice;
    }

    if (formData.theoretical_course) {
      total += settings.theoretical_course_price || 200;
    }

    return total;
  };

  const handleSubmit = async () => {
    if (isInstructor) {
      alert('Instrutores não podem se cadastrar como alunos.');
      return;
    }
    setLoading(true);
    try {
      let totalCarLessons = 0;
      let totalMotoLessons = 0;

      if (['B', 'AB', 'onibus', 'carreta'].includes(formData.category)) {
        totalCarLessons = 2 + formData.extra_car_lessons;
      }
      if (['A', 'AB'].includes(formData.category)) {
        totalMotoLessons = 2 + formData.extra_moto_lessons;
      }
      if (formData.category === 'inclusao_A') {
        totalMotoLessons = 2 + formData.extra_moto_lessons;
      }
      if (formData.category === 'inclusao_B') {
        totalCarLessons = 2 + formData.extra_car_lessons;
      }

      await base44.entities.Student.create({
        ...formData,
        total_car_lessons: totalCarLessons,
        total_moto_lessons: totalMotoLessons,
        completed_car_lessons: 0,
        completed_moto_lessons: 0,
        total_paid: 0,
        payment_status: 'pendente',
        user_email: user?.email,
        cnh_approved: formData.has_cnh !== false,
        all_lessons_completed: false,
        admin_confirmed: false,
        exam_done: false,
        theoretical_test_done: false,
        practical_test_done: false
      });

      navigate(createPageUrl('Payment') + '?amount=' + calculateTotal());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'A', label: 'Categoria A', icon: Bike, desc: 'Moto' },
    { value: 'B', label: 'Categoria B', icon: Car, desc: 'Carro' },
    { value: 'AB', label: 'Categoria AB', icon: Car, desc: 'Carro + Moto' },
    { value: 'inclusao_A', label: 'Inclusão A', icon: Bike, desc: 'Adicionar Moto' },
    { value: 'inclusao_B', label: 'Inclusão B', icon: Car, desc: 'Adicionar Carro' },
    { value: 'onibus', label: 'Ônibus', icon: Bus, desc: 'Categoria D' },
    { value: 'carreta', label: 'Carreta', icon: Truck, desc: 'Categoria E' },
  ];

  if (isInstructor) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-[#374151] max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-white font-semibold">Instrutores não podem se cadastrar como alunos.</p>
            <Button className="mt-4" onClick={() => navigate(createPageUrl('Home'))}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= s ? 'bg-[#1e40af] text-white' : 'bg-[#374151] text-[#9ca3af]'
            }`}>
              {step > s ? <Check size={20} /> : s}
            </div>
            {s < 4 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-[#1e40af]' : 'bg-[#374151]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Dados Pessoais */}
      {step === 1 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPF *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div>
                <Label>RENACH *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.renach}
                  onChange={(e) => setFormData({...formData, renach: e.target.value})}
                  placeholder="Número do RENACH"
                />
              </div>
            </div>

            <div>
              <Label>CEP</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.cep}
                onChange={(e) => setFormData({...formData, cep: formatCEP(e.target.value)})}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>WhatsApp *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: formatPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <Button 
              className="w-full bg-[#1e40af] hover:bg-[#3b82f6] mt-4"
              onClick={() => setStep(2)}
              disabled={!formData.full_name || !formData.cpf || !formData.renach || !formData.whatsapp}
            >
              Continuar <ArrowRight className="ml-2" size={18} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Categoria */}
      {step === 2 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Escolha sua Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={formData.category} 
              onValueChange={(value) => setFormData({...formData, category: value, has_cnh: null})}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div 
                      key={cat.value}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        formData.category === cat.value 
                          ? 'border-[#fbbf24] bg-[#fbbf24]/10' 
                          : 'border-[#374151] hover:border-[#3b82f6]'
                      }`}
                      onClick={() => setFormData({...formData, category: cat.value, has_cnh: null})}
                    >
                      <RadioGroupItem value={cat.value} id={cat.value} />
                      <Icon className="text-[#fbbf24]" size={24} />
                      <div>
                        <Label htmlFor={cat.value} className="cursor-pointer font-bold">{cat.label}</Label>
                        <p className="text-xs text-[#9ca3af]">{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {formData.category === 'A' && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151] mt-4">
                <Label className="mb-3 block">Você já possui CNH?</Label>
                <div className="flex gap-4">
                  <Button
                    variant={formData.has_cnh === true ? 'default' : 'outline'}
                    className={formData.has_cnh === true ? 'bg-[#1e40af]' : 'border-[#374151]'}
                    onClick={() => setFormData({...formData, has_cnh: true})}
                  >
                    Sim
                  </Button>
                  <Button
                    variant={formData.has_cnh === false ? 'default' : 'outline'}
                    className={formData.has_cnh === false ? 'bg-[#1e40af]' : 'border-[#374151]'}
                    onClick={() => setFormData({...formData, has_cnh: false})}
                  >
                    Não, primeira habilitação
                  </Button>
                </div>
              </div>
            )}

            {formData.has_cnh === false && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#fbbf24]/50 mt-4">
                <p className="text-sm text-[#fbbf24] mb-4">
                  Como é sua primeira habilitação, você precisa enviar fotos do documento de identidade para análise.
                  Após aprovação, você poderá agendar aulas avulsas.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Documento (Frente)</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#374151] rounded-lg cursor-pointer hover:border-[#3b82f6]">
                      {formData.cnh_front_photo ? (
                        <img src={formData.cnh_front_photo} alt="Frente" className="h-full object-cover rounded" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="text-[#9ca3af]" />
                          <span className="text-xs text-[#9ca3af] mt-1">Clique para enviar</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cnh_front_photo')} />
                    </label>
                  </div>
                  <div>
                    <Label className="mb-2 block">Documento (Verso)</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#374151] rounded-lg cursor-pointer hover:border-[#3b82f6]">
                      {formData.cnh_back_photo ? (
                        <img src={formData.cnh_back_photo} alt="Verso" className="h-full object-cover rounded" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="text-[#9ca3af]" />
                          <span className="text-xs text-[#9ca3af] mt-1">Clique para enviar</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cnh_back_photo')} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black px-6 py-6 text-base font-bold" 
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2" size={20} /> VOLTAR
              </Button>
              <Button 
                className="flex-1 bg-[#1e40af] hover:bg-[#3b82f6] px-6 py-6 text-base font-bold"
                onClick={() => setStep(3)}
                disabled={!formData.category || (formData.category === 'A' && formData.has_cnh === null)}
              >
                CONTINUAR <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pacotes */}
      {step === 3 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Escolha seu Pacote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">Pacote Base - Categoria {formData.category}</span>
                <span className="text-[#fbbf24] font-bold">
                  R$ {formData.category === 'AB' 
                    ? (settings?.category_ab_price || 992)
                    : (settings?.category_a_price || 548)},00
                </span>
              </div>
              <p className="text-sm text-[#9ca3af]">
                {['B', 'onibus', 'carreta'].includes(formData.category) && '2 aulas de carro inclusas'}
                {formData.category === 'A' && '2 aulas de moto inclusas'}
                {formData.category === 'AB' && '2 aulas de carro + 2 aulas de moto inclusas'}
                {formData.category === 'inclusao_A' && '2 aulas de moto inclusas'}
                {formData.category === 'inclusao_B' && '2 aulas de carro inclusas'}
              </p>
            </div>

            {['B', 'AB', 'inclusao_B', 'onibus', 'carreta'].includes(formData.category) && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold flex items-center gap-2">
                      <Car size={20} className="text-[#3b82f6]" />
                      Aulas extras de Carro
                    </span>
                    <p className="text-sm text-[#9ca3af]">R$ {settings?.lesson_price || 98},00 cada</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-8 w-8"
                      onClick={() => setFormData({...formData, extra_car_lessons: Math.max(0, formData.extra_car_lessons - 1)})}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="w-8 text-center font-bold">{formData.extra_car_lessons}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-8 w-8"
                      onClick={() => setFormData({...formData, extra_car_lessons: formData.extra_car_lessons + 1})}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {['A', 'AB', 'inclusao_A'].includes(formData.category) && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold flex items-center gap-2">
                      <Bike size={20} className="text-[#fbbf24]" />
                      Aulas extras de Moto
                    </span>
                    <p className="text-sm text-[#9ca3af]">R$ {settings?.lesson_price || 98},00 cada</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-8 w-8"
                      onClick={() => setFormData({...formData, extra_moto_lessons: Math.max(0, formData.extra_moto_lessons - 1)})}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="w-8 text-center font-bold">{formData.extra_moto_lessons}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-8 w-8"
                      onClick={() => setFormData({...formData, extra_moto_lessons: formData.extra_moto_lessons + 1})}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-4 bg-[#111827] rounded-lg border border-[#374151]">
              <Checkbox 
                id="theoretical"
                checked={formData.theoretical_course}
                onCheckedChange={(checked) => setFormData({...formData, theoretical_course: checked})}
              />
              <div className="flex-1">
                <Label htmlFor="theoretical" className="cursor-pointer font-bold">Curso Teórico EAD</Label>
                <p className="text-sm text-[#9ca3af]">Material completo online</p>
              </div>
              <span className="text-[#fbbf24] font-bold">+ R$ {settings?.theoretical_course_price || 200},00</span>
            </div>

            <div className="p-4 bg-[#1e40af]/20 rounded-lg border border-[#1e40af]">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-[#fbbf24]">R$ {calculateTotal().toFixed(2)}</span>
              </div>
              <p className="text-sm text-[#9ca3af] mt-1">Parcelamento em até 10x com juros</p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black px-6 py-6 text-base font-bold" 
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="mr-2" size={20} /> VOLTAR
              </Button>
              <Button 
                className="flex-1 bg-[#1e40af] hover:bg-[#3b82f6] px-6 py-6 text-base font-bold"
                onClick={() => setStep(4)}
              >
                CONTINUAR <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmação */}
      {step === 4 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Confirmar Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-[#111827] rounded">
                <span className="text-[#9ca3af]">Nome</span>
                <span className="font-medium">{formData.full_name}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#111827] rounded">
                <span className="text-[#9ca3af]">CPF</span>
                <span className="font-medium">{formData.cpf}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#111827] rounded">
                <span className="text-[#9ca3af]">RENACH</span>
                <span className="font-medium">{formData.renach}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#111827] rounded">
                <span className="text-[#9ca3af]">Categoria</span>
                <span className="font-medium text-[#fbbf24]">{formData.category}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#111827] rounded">
                <span className="text-[#9ca3af]">WhatsApp</span>
                <span className="font-medium">{formData.whatsapp}</span>
              </div>
            </div>

            <div className="p-4 bg-[#1e40af]/20 rounded-lg border border-[#1e40af]">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total a Pagar</span>
                <span className="text-2xl font-bold text-[#fbbf24]">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black px-6 py-6 text-base font-bold" 
                onClick={() => setStep(3)}
              >
                <ArrowLeft className="mr-2" size={20} /> VOLTAR
              </Button>
              <Button 
                className="flex-1 bg-[#fbbf24] text-black hover:bg-[#fbbf24]/80 px-6 py-6 text-base font-bold"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'PROCESSANDO...' : (
                  <>
                    <CreditCard className="mr-2" size={20} /> IR PARA PAGAMENTO
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}