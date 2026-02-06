import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar as CalendarIcon, QrCode, Wallet, CheckCircle2, Lock } from "lucide-react";

export default function AdminPayouts() {
  const [settings, setSettings] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodLength, setPeriodLength] = useState("15"); // "15" | "30"
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payouts, setPayouts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsArr, instr, doneLessons] = await Promise.all([
        base44.entities.AppSettings.list(),
        base44.entities.Instructor.filter({ active: true }),
        base44.entities.Lesson.filter({ status: "realizada" })
      ]);
      setSettings(settingsArr?.[0] || null);
      setInstructors(instr || []);
      setLessons(doneLessons || []);
    } finally {
      setLoading(false);
    }
  };

  const period = useMemo(() => {
    const end = new Date(endDate + "T00:00:00");
    const len = parseInt(periodLength, 10);
    const start = new Date(end);
    start.setDate(start.getDate() - (len - 1));
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { start: fmt(start), end: fmt(end), length: len };
  }, [endDate, periodLength]);

  const rows = useMemo(() => {
    if (!settings) return [];
    const carRate = Number(settings.instructor_car_commission || 0);
    const motoRate = Number(settings.instructor_moto_commission || 0);

    const inRangeLessons = lessons.filter((l) => {
      const d = l.date;
      return d >= period.start && d <= period.end && l.status === "realizada";
    });

    const map = new Map();
    inRangeLessons.forEach((l) => {
      const key = l.instructor_id;
      if (!key) return;
      const current = map.get(key) || { car: 0, moto: 0 };
      if (l.type === "carro") current.car += 1;
      if (l.type === "moto") current.moto += 1;
      map.set(key, current);
    });

    return instructors.map((inst) => {
      const counts = map.get(inst.id) || { car: 0, moto: 0 };
      const amount = counts.car * carRate + counts.moto * motoRate;
      const method = inst.pix_key ? "pix" : "dinheiro";
      return {
        instructor: inst,
        car: counts.car,
        moto: counts.moto,
        amount,
        method,
      };
    }).filter(r => r.amount > 0);
  }, [settings, instructors, lessons, period]);

  const loadPayouts = async () => {
    const all = await base44.entities.InstructorPayout.filter({ period_start: period.start, period_end: period.end });
    setPayouts(all || []);
  };

  useEffect(() => {
    if (!loading) loadPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.start, period.end, loading]);

  const formatBRL = (n) => (Number(n || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const existing = await base44.entities.InstructorPayout.filter({ period_start: period.start, period_end: period.end });
      const already = new Set((existing || []).map(p => p.instructor_id));

      const toCreate = rows.filter(r => !already.has(r.instructor.id)).map(r => ({
        instructor_id: r.instructor.id,
        instructor_name: r.instructor.full_name,
        period_start: period.start,
        period_end: period.end,
        lessons_count_car: r.car,
        lessons_count_moto: r.moto,
        amount_due: Number(r.amount),
        method: r.method,
        status: "pendente",
        pix_key_snapshot: r.instructor.pix_key || "",
      }));

      if (toCreate.length > 0) {
        await base44.entities.InstructorPayout.bulkCreate(toCreate);
      }
      await loadPayouts();
      alert(toCreate.length > 0 ? "Comandos gerados com sucesso" : "Nada para gerar (já existem comandos para o período)");
    } finally {
      setGenerating(false);
    }
  };

  const markPaid = async (p) => {
    await base44.entities.InstructorPayout.update(p.id, { status: "pago", paid_at: new Date().toISOString() });
    await loadPayouts();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === 'KALABASTRO') {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  // Modal de senha
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-[#1a2332] border-2 border-[#fbbf24] w-full max-w-md">
          <CardHeader className="border-b border-[#374151] pb-4">
            <div className="flex items-center justify-center gap-3">
              <Lock className="text-[#fbbf24]" size={28} />
              <CardTitle className="text-xl text-white">Área Restrita</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-[#9ca3af] mb-2 block">Digite a senha para acessar os pagamentos dos instrutores</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="••••••••"
                  className={`bg-[#111827] border-[#374151] text-white text-center text-lg tracking-widest ${
                    passwordError ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-400 text-xs mt-2 text-center">Senha incorreta. Tente novamente.</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#f0c41b] text-black hover:bg-[#d4aa00] font-bold"
              >
                Desbloquear
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="text-[#f0c41b]" />
        <h1 className="text-2xl font-bold">Pagamentos a Instrutores</h1>
      </div>

      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-white text-base">Período</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-[#9ca3af]">Tipo</label>
            <Select value={periodLength} onValueChange={setPeriodLength}>
              <SelectTrigger className="bg-[#111827] border-[#374151] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-[#374151]">
                <SelectItem value="15">Quinzenal (15 dias)</SelectItem>
                <SelectItem value="30">Mensal (30 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-[#9ca3af]">Data de término</label>
            <div className="flex items-center gap-2 mt-1">
              <CalendarIcon size={16} className="text-[#9ca3af]" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#111827] border-[#374151]" />
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={generating} className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] w-full">
              {generating ? "Gerando..." : "Gerar comandos"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-white text-base">Resumo do período ({period.start} a {period.end})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-[#9ca3af]">Nenhum valor a pagar neste período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#9ca3af]">
                    <th className="py-2">Instrutor</th>
                    <th className="py-2">Carro</th>
                    <th className="py-2">Moto</th>
                    <th className="py-2">Valor</th>
                    <th className="py-2">Método</th>
                    <th className="py-2">Chave PIX</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.instructor.id} className="border-t border-[#374151]">
                      <td className="py-2 font-medium">{r.instructor.full_name}</td>
                      <td className="py-2">{r.car}</td>
                      <td className="py-2">{r.moto}</td>
                      <td className="py-2 text-[#f0c41b] font-semibold">{formatBRL(r.amount)}</td>
                      <td className="py-2">
                        {r.method === 'pix' ? (
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/40">PIX</Badge>
                        ) : (
                          <Badge className="bg-slate-500/20 text-slate-300 border border-slate-500/40">Dinheiro</Badge>
                        )}
                      </td>
                      <td className="py-2 text-[#9ca3af]">{r.instructor.pix_key || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-white text-base">Comandos Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-[#9ca3af]">Nenhum comando gerado para o período selecionado.</p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-[#374151] bg-[#0d1117]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center">
                      {p.method === 'pix' ? <QrCode className="text-[#f0c41b]" /> : <Wallet className="text-white" />}
                    </div>
                    <div>
                      <div className="font-semibold">{p.instructor_name}</div>
                      <div className="text-xs text-[#9ca3af]">{p.period_start} a {p.period_end}</div>
                      <div className="text-xs text-[#9ca3af]">PIX: {p.pix_key_snapshot || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-[#f0c41b] font-bold">{formatBRL(p.amount_due)}</div>
                    {p.status === 'pago' ? (
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Pago
                      </Badge>
                    ) : (
                      <Button onClick={() => markPaid(p)} className="bg-green-600 hover:bg-green-700">Marcar como pago</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}