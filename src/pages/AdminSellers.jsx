import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { 
  UserCog, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Phone,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    active: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sellersData = await base44.entities.Seller.list();
      setSellers(sellersData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingSeller) {
        await base44.entities.Seller.update(editingSeller.id, formData);
      } else {
        await base44.entities.Seller.create(formData);
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const handleEdit = (seller) => {
    setEditingSeller(seller);
    setFormData(seller);
    setShowDialog(true);
  };

  const handleDelete = async (sellerId) => {
    if (confirm('Tem certeza que deseja excluir este vendedor?')) {
      try {
        await base44.entities.Seller.delete(sellerId);
        loadData();
      } catch (e) {
        console.log(e);
      }
    }
  };

  const resetForm = () => {
    setEditingSeller(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      active: true
    });
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
    <div className="space-y-6">
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
            <UserCog className="text-[#fbbf24]" />
            Gerenciar Vendedores
          </h1>
        </div>
        <Button 
          className="bg-[#1e40af] hover:bg-[#3b82f6]"
          onClick={() => { resetForm(); setShowDialog(true); }}
        >
          <Plus className="mr-2" size={18} />
          Novo Vendedor
        </Button>
      </div>

      <p className="text-[#9ca3af] text-sm">
        Vendedores podem responder às mensagens dos alunos no chat.
      </p>

      {/* Lista de Vendedores */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sellers.map((seller) => (
          <Card key={seller.id} className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1e40af]/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#fbbf24]">
                      {seller.full_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold">{seller.full_name}</p>
                    <p className="text-xs text-[#9ca3af] flex items-center gap-1">
                      <Mail size={12} /> {seller.email}
                    </p>
                    {seller.phone && (
                      <p className="text-xs text-[#9ca3af] flex items-center gap-1">
                        <Phone size={12} /> {seller.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={seller.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {seller.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-[#374151] flex-1"
                  onClick={() => handleEdit(seller)}
                >
                  <Edit size={14} className="mr-1" /> Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-400"
                  onClick={() => handleDelete(seller.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sellers.length === 0 && (
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-8 text-center">
            <UserCog className="mx-auto text-[#9ca3af] mb-4" size={48} />
            <p className="text-[#9ca3af]">Nenhum vendedor cadastrado</p>
            <Button 
              className="bg-[#1e40af] hover:bg-[#3b82f6] mt-4"
              onClick={() => { resetForm(); setShowDialog(true); }}
            >
              <Plus className="mr-2" size={18} />
              Adicionar Vendedor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={showDialog} onOpenChange={() => { setShowDialog(false); resetForm(); }}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>{editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input 
                type="email"
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input 
                className="bg-[#111827] border-[#374151] mt-1"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#111827] rounded border border-[#374151]">
              <span>Vendedor Ativo</span>
              <Switch 
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-[#374151]" onClick={() => { setShowDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#1e40af] hover:bg-[#3b82f6]"
              onClick={handleSave}
              disabled={!formData.full_name || !formData.email}
            >
              <Save className="mr-2" size={18} />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}