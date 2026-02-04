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
  Truck,
  MapPin
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import LessonScheduler from "../components/schedule/LessonScheduler";

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
    address_street: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    whatsapp: '',
    phone: '',
    category: '',
    has_cnh: null,
    cnh_front_photo: '',
    cnh_back_photo: '',
    seller_code: ''
  });
  
  const [lessonQuantities, setLessonQuantities] = useState({
    carro: 0,
    moto: 0,
    onibus: 0,
    caminhao: 0,
    carreta: 0
  });
  
  const [lessonSchedules, setLessonSchedules] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (step === 5 && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

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

  const [cepError, setCepError] = useState('');

  const handleCepChange = async (value) => {
    const masked = formatCEP(value);
    setFormData(prev => ({ ...prev, cep: masked }));
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      setCepError('');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data?.erro) {
          setCepError('CEP não encontrado');
          setFormData(prev => ({ ...prev, address_street: '', address_neighborhood: '', address_city: '', address_state: '' }));
        } else {
          setFormData(prev => ({
            ...prev,
            address_street: data.logradouro || '',
            address_neighborhood: data.bairro || '',
            address_city: data.localidade || '',
            address_state: data.uf || ''
          }));
        }
      } catch (e) {
        setCepError('Falha ao buscar CEP');
      }
    } else {
      setCepError('');
    }
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
    
    // Preço base da categoria
    let categoryPrice = 0;
    if (formData.category === 'A') categoryPrice = settings.category_a_price || 548;
    else if (formData.category === 'B') categoryPrice = settings.category_b_price || 548;
    else if (formData.category === 'AB') categoryPrice = settings.category_ab_price || 992;
    else if (formData.category === 'inclusao_A') categoryPrice = settings.category_inclusao_a_price || 400;
    else if (formData.category === 'inclusao_B') categoryPrice = settings.category_inclusao_b_price || 400;
    else if (formData.category === 'onibus') categoryPrice = settings.category_bus_price || 1500;
    else if (formData.category === 'caminhao') categoryPrice = settings.category_truck_price || 1800;
    else if (formData.category === 'carreta') categoryPrice = settings.category_trailer_price || 2200;
    
    // Calcular custo das aulas extras (após as 2 primeiras incluídas)
    let extraCost = 0;
    if (lessonSchedules.length > 2) {
      const extraLessons = lessonSchedules.slice(2);
      extraLessons.forEach(lesson => {
        if (lesson.type === 'carro') {
          extraCost += settings.lesson_price_car || settings.lesson_price || 98;
        } else if (lesson.type === 'moto') {
          extraCost += settings.lesson_price_moto || settings.lesson_price || 98;
        } else if (lesson.type === 'onibus') {
          extraCost += settings.lesson_price_bus || 150;
        } else if (lesson.type === 'caminhao') {
          extraCost += settings.lesson_price_truck || 180;
        } else if (lesson.type === 'carreta') {
          extraCost += settings.lesson_price_trailer || 200;
        }
      });
    }
    
    return categoryPrice + extraCost;
  };

  const handleSubmit = async () => {
    if (isInstructor) {
      alert('Instrutores não podem se cadastrar como alunos.');
      return;
    }
    setLoading(true);
    try {
      let totalCarLessons = lessonSchedules.filter(l => l.type === 'carro').length;
      let totalMotoLessons = lessonSchedules.filter(l => l.type === 'moto').length;

      // Código do consultor (opcional)
      const rawCode = (formData.seller_code || '').trim().toUpperCase();
      const todayStr = new Date().toISOString().split('T')[0];
      let referralSeller = null;
      if (rawCode) {
        const sellers = await base44.entities.Seller.filter({ active: true });
        const getDailyCode = (s) => {
          const seed = (s.id || '') + (s.email || '') + todayStr;
          let h = 0; for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
          return Math.abs(h).toString(36).toUpperCase().slice(0, 6).padStart(6, '0');
        };
        referralSeller = (sellers || []).find((s) => getDailyCode(s) === rawCode) || null;
      }

      const total = calculateTotal();

      if (paymentMethod === 'pix') {
        // PIX: Criar aluno diretamente e aprovar pagamento automaticamente
        const { seller_code, ...studentPayload } = formData;
        const studentData = {
          ...studentPayload,
          user_email: user?.email,
          ref_seller_id: referralSeller?.id,
          ref_seller_name: referralSeller?.full_name,
          ref_code_date: referralSeller ? todayStr : undefined,
          total_paid: total,
          payment_status: 'pago',
          total_car_lessons: totalCarLessons,
          total_moto_lessons: totalMotoLessons,
          completed_car_lessons: 0,
          completed_moto_lessons: 0,
          cnh_approved: formData.has_cnh !== false,
          all_lessons_completed: false,
          admin_confirmed: false,
          exam_done: false,
          theoretical_test_done: false,
          practical_test_done: false
        };

        const newStudent = await base44.entities.Student.create(studentData);

        // Criar aulas agendadas
        for (const schedule of lessonSchedules) {
          await base44.entities.Lesson.create({
            student_id: newStudent.id,
            student_name: formData.full_name,
            student_renach: formData.renach,
            instructor_id: schedule.instructor_id,
            instructor_name: schedule.instructor_name,
            date: schedule.date,
            time: schedule.time,
            type: schedule.type,
            status: 'agendada',
            trial: false
          });
        }

        // Criar registro de pagamento
        await base44.entities.Payment.create({
          student_id: newStudent.id,
          student_name: formData.full_name,
          amount: total,
          method: 'pix',
          description: 'Pagamento inicial - Cadastro',
          status: 'aprovado',
          transaction_id: 'PIX_AUTO_' + Date.now()
        });

        // Adicionar cashback ao vendedor se houver
        if (referralSeller && settings?.seller_cashback_amount) {
          await base44.entities.Seller.update(referralSeller.id, {
            cashback_balance: (referralSeller.cashback_balance || 0) + settings.seller_cashback_amount,
            total_referrals: (referralSeller.total_referrals || 0) + 1
          });
        }

        alert('✅ Cadastro concluído com sucesso! Pagamento PIX aprovado automaticamente.');
        navigate(createPageUrl('Home'));
        
      } else {
        // Cartão: Criar aluno e aulas, depois redirecionar para Stripe
        const { seller_code, ...studentPayload } = formData;
        const studentData = {
          ...studentPayload,
          user_email: user?.email,
          ref_seller_id: referralSeller?.id,
          ref_seller_name: referralSeller?.full_name,
          ref_code_date: referralSeller ? todayStr : undefined,
          total_paid: 0,
          payment_status: 'pendente',
          total_car_lessons: totalCarLessons,
          total_moto_lessons: totalMotoLessons,
          completed_car_lessons: 0,
          completed_moto_lessons: 0,
          cnh_approved: formData.has_cnh !== false,
          all_lessons_completed: false,
          admin_confirmed: false,
          exam_done: false,
          theoretical_test_done: false,
          practical_test_done: false
        };

        const newStudent = await base44.entities.Student.create(studentData);

        // Criar aulas agendadas
        for (const schedule of lessonSchedules) {
          await base44.entities.Lesson.create({
            student_id: newStudent.id,
            student_name: formData.full_name,
            student_renach: formData.renach,
            instructor_id: schedule.instructor_id,
            instructor_name: schedule.instructor_name,
            date: schedule.date,
            time: schedule.time,
            type: schedule.type,
            status: 'agendada',
            trial: false
          });
        }

        // Criar pagamento pendente
        const payment = await base44.entities.Payment.create({
          student_id: newStudent.id,
          student_name: formData.full_name,
          amount: total,
          method: 'cartao',
          description: 'Pagamento inicial - Cadastro',
          status: 'pendente'
        });

        // Salvar dados do vendedor para o webhook
        localStorage.setItem('pending_seller_data', JSON.stringify({
          seller_id: referralSeller?.id,
          student_id: newStudent.id
        }));

        // Redirecionar direto para Stripe checkout
        const { data } = await base44.functions.invoke('createStripeCheckout', {
          amount: total,
          studentId: newStudent.id,
          paymentId: payment.id,
          purchaseType: 'inscricao',
          purchaseQty: 1,
        });
        
        if (data?.url) {
          window.location.href = data.url;
        } else {
          alert('Erro ao criar checkout do Stripe. Tente novamente.');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao processar cadastro: ' + error.message);
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
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto px-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-base font-bold ${
              step >= s ? 'bg-[#f0c41b] text-black' : 'bg-[#374151] text-[#9ca3af]'
            }`}>
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 5 && (
              <div className={`w-8 sm:w-16 h-1 ${step > s ? 'bg-[#f0c41b]' : 'bg-[#374151]'}`} />
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
                onChange={(e) => setFormData({...formData, full_name: e.target.value.toUpperCase()})}
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
                  onChange={(e) => setFormData({...formData, renach: e.target.value.toUpperCase()})}
                  placeholder="Número do RENACH"
                />
              </div>
            </div>

            <div>
              <Label>CEP *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
              {cepError && <p className="text-red-400 text-sm mt-1">{cepError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>Rua</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.address_street}
                  readOnly
                  placeholder="Preenchido automaticamente"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.address_city}
                  readOnly
                  placeholder="Preenchido automaticamente"
                />
              </div>
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
                <Label>Telefone *</Label>
                <Input 
                  className="bg-[#111827] border-[#374151] mt-1"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <Label>Código do Consultor (opcional)</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.seller_code}
                onChange={(e) => setFormData({...formData, seller_code: e.target.value.toUpperCase()})}
                placeholder="Ex: ABC123"
              />
              <p className="text-xs text-[#9ca3af] mt-1">Se você recebeu um código de um consultor, informe aqui para ajudar o vendedor.</p>
            </div>

            <Button 
              className="w-full bg-[#1e40af] hover:bg-[#3b82f6] mt-4"
              onClick={() => setStep(2)}
              disabled={
                !formData.full_name ||
                !formData.cpf ||
                !formData.renach ||
                !formData.whatsapp ||
                !formData.phone ||
                ((formData.cep || '').replace(/\D/g,'').length !== 8) ||
                !!cepError
              }
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
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151] mt-4">
                <p className="text-sm text-[#9ca3af] mb-4">
                  Como é sua primeira habilitação, você precisa enviar fotos do documento de identidade para análise.
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
                className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-6 py-6 text-base font-bold"
                onClick={() => {
                  // Resetar quantidades baseado na categoria
                  const newQuantities = { carro: 0, moto: 0, onibus: 0, caminhao: 0, carreta: 0 };
                  if (['B', 'AB', 'onibus', 'carreta', 'inclusao_B'].includes(formData.category)) {
                    newQuantities.carro = 2;
                  }
                  if (['A', 'AB', 'inclusao_A'].includes(formData.category)) {
                    newQuantities.moto = 2;
                  }
                  if (formData.category === 'onibus') {
                    newQuantities.onibus = 2;
                  }
                  if (formData.category === 'caminhao') {
                    newQuantities.caminhao = 2;
                  }
                  if (formData.category === 'carreta') {
                    newQuantities.carreta = 2;
                  }
                  setLessonQuantities(newQuantities);
                  setStep(3);
                }}
                disabled={!formData.category || (formData.category === 'A' && formData.has_cnh === null)}
              >
                CONTINUAR <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Escolher Quantidade de Aulas */}
      {step === 3 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Quantas aulas você quer agendar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#9ca3af]">Escolha quantas aulas de cada tipo você deseja agendar agora. Você pode adicionar mais aulas depois.</p>
            
            {(['B', 'AB', 'onibus', 'carreta', 'inclusao_B'].includes(formData.category)) && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Car size={24} className="text-[#3b82f6]" />
                    <span className="font-bold text-white">Aulas de Carro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, carro: Math.max(2, lessonQuantities.carro - 1)})}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="w-12 text-center font-bold text-xl text-white">{lessonQuantities.carro}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, carro: lessonQuantities.carro + 1})}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {(['A', 'AB', 'inclusao_A'].includes(formData.category)) && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bike size={24} className="text-[#fbbf24]" />
                    <span className="font-bold text-white">Aulas de Moto</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, moto: Math.max(2, lessonQuantities.moto - 1)})}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="w-12 text-center font-bold text-xl text-white">{lessonQuantities.moto}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, moto: lessonQuantities.moto + 1})}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {formData.category === 'onibus' && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bus size={24} className="text-green-400" />
                    <span className="font-bold text-white">Aulas de Ônibus</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, onibus: Math.max(2, lessonQuantities.onibus - 1)})}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="w-12 text-center font-bold text-xl text-white">{lessonQuantities.onibus}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, onibus: lessonQuantities.onibus + 1})}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {formData.category === 'caminhao' && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Truck size={24} className="text-orange-400" />
                    <span className="font-bold text-white">Aulas de Caminhão</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, caminhao: Math.max(2, lessonQuantities.caminhao - 1)})}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="w-12 text-center font-bold text-xl text-white">{lessonQuantities.caminhao}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, caminhao: lessonQuantities.caminhao + 1})}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {formData.category === 'carreta' && (
              <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Truck size={24} className="text-purple-400" />
                    <span className="font-bold text-white">Aulas de Carreta</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, carreta: Math.max(2, lessonQuantities.carreta - 1)})}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="w-12 text-center font-bold text-xl text-white">{lessonQuantities.carreta}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-[#374151] h-10 w-10"
                      onClick={() => setLessonQuantities({...lessonQuantities, carreta: lessonQuantities.carreta + 1})}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black px-6 py-6 text-base font-bold" 
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="mr-2" size={20} /> VOLTAR
              </Button>
              <Button 
                className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-6 py-6 text-base font-bold"
                onClick={() => setStep(4)}
              >
                CONTINUAR <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Agendar Aulas */}
      {step === 4 && (
        <LessonScheduler
          lessonsConfig={lessonQuantities}
          onSchedulesComplete={(schedules) => {
            setLessonSchedules(schedules);
            setTimeRemaining(300);
            setStep(5);
          }}
          onBack={() => setStep(3)}
          settings={settings}
        />
      )}

      {/* Step 5: Confirmação + Resumo com Mapa + Pagamento */}
      {step === 5 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardHeader>
            <CardTitle className="text-[#fbbf24]">Confirmar Cadastro e Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cronômetro de 5 minutos */}
            <div className="p-4 bg-orange-500/10 border border-orange-500 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-orange-400">⏱️ Tempo Restante</span>
                <span className="text-2xl font-bold text-orange-400">
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
              <p className="text-sm text-orange-300">
                Seus agendamentos serão finalizados e apagados após {Math.ceil(timeRemaining / 60)} minutos. 
                Os agendamentos só serão confirmados após o pagamento.
              </p>
            </div>
            {/* Resumo dos dados */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-[#fbbf24]">Seus Dados</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[#111827] rounded">
                  <span className="text-[#9ca3af]">Nome:</span>
                  <p className="font-medium truncate text-white">{formData.full_name}</p>
                </div>
                <div className="p-2 bg-[#111827] rounded">
                  <span className="text-[#9ca3af]">Categoria:</span>
                  <p className="font-medium text-[#fbbf24]">{formData.category}</p>
                </div>
              </div>
            </div>

            {/* Resumo das aulas agendadas */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-[#fbbf24]">Aulas Agendadas ({lessonSchedules.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {lessonSchedules.map((schedule, idx) => {
                  const [year, month, day] = schedule.date.split('-');
                  const displayDate = `${day}/${month}/${year}`;
                  return (
                    <div key={idx} className="p-2 bg-[#111827] rounded text-xs flex items-center justify-between">
                      <span className="truncate flex-1">
                        <span className={schedule.type === 'carro' || schedule.type === 'moto' ? 'text-white' : ''}>{schedule.type.toUpperCase()}</span> - <span className="text-[#fbbf24] font-bold">{schedule.instructor_name}</span>
                      </span>
                      <span className="text-[#fbbf24] font-semibold whitespace-nowrap ml-2">
                        {displayDate} {schedule.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Locais das aulas */}
            {settings?.lesson_locations && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-[#fbbf24]">LOCAIS DAS AULAS</h3>
                <div className="space-y-3">
                  {[...new Set(lessonSchedules.map(s => s.type))].map((type) => {
                    const loc = settings.lesson_locations?.[type];
                    if (!loc) return null;
                    const typeNames = {
                      carro: 'CARRO',
                      moto: 'MOTO',
                      onibus: 'ÔNIBUS',
                      caminhao: 'CAMINHÃO',
                      carreta: 'CARRETA'
                    };
                    return (
                      <div key={type} className="p-3 bg-[#111827] rounded-lg border border-[#374151]">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="text-[#fbbf24]" size={16} />
                          <span className="font-bold uppercase text-white">ENDEREÇO AULA {typeNames[type] || type.toUpperCase()}</span>
                        </div>
                        <p className="text-[#e6edf3] text-sm mb-3">{loc.address || 'Endereço não definido'}</p>
                        {typeof loc.lat === 'number' && typeof loc.lng === 'number' && (
                          <div className="rounded-lg overflow-hidden border border-[#374151]">
                            <iframe
                              width="100%"
                              height="200"
                              frameBorder="0"
                              style={{ border: 0 }}
                              src={`https://www.google.com/maps?q=${loc.lat},${loc.lng}&output=embed&z=15`}
                              allowFullScreen
                              title={`Mapa ${typeNames[type] || type}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resumo Financeiro */}
            {settings && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-[#fbbf24]">Resumo do Pagamento</h3>
                <div className="p-3 bg-[#111827] rounded border border-[#374151]">
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Taxa de Categoria ({formData.category}):</span>
                      <span className="font-semibold text-white text-base">
                        R$ {(() => {
                          if (formData.category === 'A') return (settings.category_a_price || 548).toFixed(2);
                          if (formData.category === 'B') return (settings.category_b_price || 548).toFixed(2);
                          if (formData.category === 'AB') return (settings.category_ab_price || 992).toFixed(2);
                          if (formData.category === 'inclusao_A') return (settings.category_inclusao_a_price || 400).toFixed(2);
                          if (formData.category === 'inclusao_B') return (settings.category_inclusao_b_price || 400).toFixed(2);
                          if (formData.category === 'onibus') return (settings.category_bus_price || 1500).toFixed(2);
                          if (formData.category === 'caminhao') return (settings.category_truck_price || 1800).toFixed(2);
                          if (formData.category === 'carreta') return (settings.category_trailer_price || 2200).toFixed(2);
                          return '0.00';
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">Aulas incluídas no pacote:</span>
                      <span className="font-semibold text-white text-base">2 aulas</span>
                    </div>
                    {lessonSchedules.length > 2 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[#9ca3af] text-xs">
                          <span>Aulas extras:</span>
                        </div>
                        {lessonSchedules.slice(2).map((lesson, idx) => {
                          const price = lesson.type === 'carro' ? (settings.lesson_price_car || settings.lesson_price || 98) :
                            lesson.type === 'moto' ? (settings.lesson_price_moto || settings.lesson_price || 98) :
                            lesson.type === 'onibus' ? (settings.lesson_price_bus || 150) :
                            lesson.type === 'caminhao' ? (settings.lesson_price_truck || 180) :
                            lesson.type === 'carreta' ? (settings.lesson_price_trailer || 200) : 98;
                          return (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-[#9ca3af]">• {lesson.type === 'carro' ? 'Carro' : lesson.type === 'moto' ? 'Moto' : lesson.type === 'onibus' ? 'Ônibus' : lesson.type === 'caminhao' ? 'Caminhão' : 'Carreta'}</span>
                              <span className="font-semibold text-white text-base">R$ {price.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="border-t border-[#374151] pt-2 mt-2 flex justify-between text-lg sm:text-xl">
                      <span className="text-[#fbbf24] font-bold">TOTAL:</span>
                      <span className="text-[#fbbf24] font-bold">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Método de Pagamento */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-[#fbbf24]">Método de Pagamento</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/10' 
                      : 'border-[#374151] hover:border-[#3b82f6]'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">💳</div>
                    <span className="text-sm font-semibold">PIX</span>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod('cartao')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paymentMethod === 'cartao' 
                      ? 'border-[#fbbf24] bg-[#fbbf24]/10' 
                      : 'border-[#374151] hover:border-[#3b82f6]'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">💳</div>
                    <span className="text-sm font-semibold">Cartão</span>
                  </div>
                </button>
              </div>
            </div>



            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-bold flex-1 sm:flex-none" 
                onClick={() => setStep(4)}
              >
                <ArrowLeft className="mr-2" size={18} /> VOLTAR
              </Button>
              <Button 
                className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00] px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base font-bold"
                onClick={handleSubmit}
                disabled={loading || timeRemaining === 0 || !paymentMethod}
              >
                {loading ? 'PROCESSANDO...' : timeRemaining === 0 ? 'TEMPO EXPIRADO' : !paymentMethod ? 'ESCOLHA O MÉTODO DE PAGAMENTO' : (
                  <>
                    <CreditCard className="mr-2" size={18} /> CONFIRMAR E PAGAR
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