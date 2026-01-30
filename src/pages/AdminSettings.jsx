import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  Settings, 
  Save, 
  DollarSign, 
  MapPin,
  Link as LinkIcon,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    car_rental: 250,
    moto_rental: 250,
    registration_fee: 100,
    lesson_price: 98,
    theoretical_course_price: 200,
    instructor_car_commission: 12,
    instructor_moto_commission: 7,
    category_a_price: 548,
    category_b_price: 548,
    category_ab_price: 992,
    pix_key: '',
    bank_info: 'Sicoob - Agência 5024 - Conta 77.487-1',
    practical_test_location: {
      lat: -16.6869,
      lng: -49.2648,
      address: ''
    },
    simulado_url: 'https://simulado.detran.gov.br',
    detran_url: 'https://goias.gov.br/detran/agendamento-detran/'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
        setFormData({
          ...formData,
          ...settingsData[0],
          practical_test_location: settingsData[0].practical_test_location || formData.practical_test_location
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        await base44.entities.AppSettings.update(settings.id, formData);
      } else {
        await base44.entities.AppSettings.create(formData);
      }
      alert('Configurações salvas com sucesso!');
      loadData();
    } catch (e) {
      console.log(e);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-[#fbbf24]" />
            Configurações do Sistema
          </h1>
        </div>
        <Button 
          className="bg-[#fbbf24] text-white hover:bg-[#fbbf24]/80"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <RefreshCw className="mr-2 animate-spin" size={18} /> : <Save className="mr-2" size={18} />}
          Salvar Alterações
        </Button>
      </div>

      {/* Valores Internos - Apenas Super Admin */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-400">
            <DollarSign />
            Valores Internos (Apenas Super Admin)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-[#9ca3af] mb-4">
            ⚠️ Estes valores NÃO são visíveis para os clientes
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Aluguel do Carro (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.car_rental}
                onChange={(e) => setFormData({...formData, car_rental: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Aluguel da Moto (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.moto_rental}
                onChange={(e) => setFormData({...formData, moto_rental: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Taxa de Cadastro (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.registration_fee}
                onChange={(e) => setFormData({...formData, registration_fee: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Preço da Aula Prática (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.lesson_price}
                onChange={(e) => setFormData({...formData, lesson_price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Comissão Instrutor Carro (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.instructor_car_commission}
                onChange={(e) => setFormData({...formData, instructor_car_commission: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Comissão Instrutor Moto (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.instructor_moto_commission}
                onChange={(e) => setFormData({...formData, instructor_moto_commission: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preços dos Pacotes - Visível para Clientes */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-[#fbbf24]">
            <DollarSign />
            Preços dos Pacotes (Visível para Clientes)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Categoria A - A partir de (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.category_a_price}
                onChange={(e) => setFormData({...formData, category_a_price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Categoria B - A partir de (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.category_b_price}
                onChange={(e) => setFormData({...formData, category_b_price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Categoria AB - A partir de (R$)</Label>
              <Input 
                type="number"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.category_ab_price}
                onChange={(e) => setFormData({...formData, category_ab_price: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <Label>Curso Teórico EAD (R$)</Label>
            <Input 
              type="number"
              className="bg-[#111827] border-[#374151] mt-1 max-w-xs"
              value={formData.theoretical_course_price}
              onChange={(e) => setFormData({...formData, theoretical_course_price: parseFloat(e.target.value)})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dados Bancários */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="text-green-400" />
            Dados Bancários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Chave PIX</Label>
            <Input 
              className="bg-[#111827] border-[#374151] mt-1"
              value={formData.pix_key}
              onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
              placeholder="CPF, CNPJ, Email, Telefone ou Chave aleatória"
            />
          </div>
          <div>
            <Label>Informações Bancárias</Label>
            <Textarea 
              className="bg-[#111827] border-[#374151] mt-1"
              value={formData.bank_info}
              onChange={(e) => setFormData({...formData, bank_info: e.target.value})}
              placeholder="Banco, Agência, Conta..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Local da Prova */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="text-[#3b82f6]" />
            Local da Prova Prática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Endereço</Label>
            <Input 
              className="bg-[#111827] border-[#374151] mt-1"
              value={formData.practical_test_location?.address || ''}
              onChange={(e) => setFormData({
                ...formData, 
                practical_test_location: {...formData.practical_test_location, address: e.target.value}
              })}
              placeholder="Endereço completo do local da prova"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input 
                type="number"
                step="0.0001"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.practical_test_location?.lat || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  practical_test_location: {...formData.practical_test_location, lat: parseFloat(e.target.value)}
                })}
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input 
                type="number"
                step="0.0001"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.practical_test_location?.lng || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  practical_test_location: {...formData.practical_test_location, lng: parseFloat(e.target.value)}
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links Externos */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="text-purple-400" />
            Links Externos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL do Simulado</Label>
            <Input 
              className="bg-[#111827] border-[#374151] mt-1"
              value={formData.simulado_url}
              onChange={(e) => setFormData({...formData, simulado_url: e.target.value})}
            />
          </div>
          <div>
            <Label>URL Agendamento DETRAN</Label>
            <Input 
              className="bg-[#111827] border-[#374151] mt-1"
              value={formData.detran_url}
              onChange={(e) => setFormData({...formData, detran_url: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        className="w-full bg-[#fbbf24] text-white hover:bg-[#fbbf24]/80 py-6"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <RefreshCw className="mr-2 animate-spin" size={18} /> : <Save className="mr-2" size={18} />}
        Salvar Todas as Alterações
      </Button>
    </div>
  );
}