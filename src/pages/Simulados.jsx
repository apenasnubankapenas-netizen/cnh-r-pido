import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Simulados() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const settingsData = await base44.entities.AppSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const simuladoLinks = [
    {
      title: 'Simulado DETRAN - Geral',
      description: 'Questões gerais para todas as categorias',
      url: settings?.simulado_url || 'https://simulado.detran.gov.br',
      icon: '📝'
    },
    {
      title: 'Legislação de Trânsito',
      description: 'Foque nas leis e normas de trânsito',
      url: 'https://simulado.detran.gov.br/legislacao',
      icon: '📋'
    },
    {
      title: 'Direção Defensiva',
      description: 'Pratique direção defensiva',
      url: 'https://simulado.detran.gov.br/direçao-defensiva',
      icon: '🛡️'
    },
    {
      title: 'Primeiros Socorros',
      description: 'Questões sobre primeiros socorros',
      url: 'https://simulado.detran.gov.br/primeiros-socorros',
      icon: '🏥'
    },
    {
      title: 'Meio Ambiente',
      description: 'Questões sobre meio ambiente e cidadania',
      url: 'https://simulado.detran.gov.br/meio-ambiente',
      icon: '🌱'
    },
    {
      title: 'Mecânica Básica',
      description: 'Conheça o funcionamento do veículo',
      url: 'https://simulado.detran.gov.br/mecanica',
      icon: '🔧'
    }
  ];

  const tips = [
    { icon: CheckCircle, text: 'Estude pelo menos 30 minutos por dia', color: 'text-green-400' },
    { icon: Clock, text: 'Faça simulados com tempo cronometrado', color: 'text-blue-400' },
    { icon: BookOpen, text: 'Revise os erros após cada simulado', color: 'text-[#fbbf24]' },
    { icon: XCircle, text: 'Não decorar, entenda a lógica das respostas', color: 'text-red-400' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <BookOpen className="inline mr-2 text-[#fbbf24]" />
          Simulados
        </h1>
        <p className="text-[#9ca3af]">Pratique para a prova teórica do DETRAN</p>
      </div>

      {/* Dicas */}
      <Card className="bg-[#1a2332] border-[#374151]">
        <CardHeader>
          <CardTitle className="text-lg">Dicas de Estudo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {tips.map((tip, idx) => {
              const Icon = tip.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#111827] rounded-lg">
                  <Icon className={tip.color} size={20} />
                  <span className="text-sm">{tip.text}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Simulados */}
      <div className="grid md:grid-cols-2 gap-4">
        {simuladoLinks.map((simulado, idx) => (
          <Card key={idx} className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{simulado.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">{simulado.title}</h3>
                  <p className="text-sm text-[#9ca3af] mb-3">{simulado.description}</p>
                  <a href={simulado.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-[#1e40af] hover:bg-[#3b82f6] w-full">
                      Acessar Simulado
                      <ExternalLink size={16} className="ml-2" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Banner Agendamento DETRAN */}
      <Card className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] border-none">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Pronto para a Prova?</h3>
          <p className="text-white/80 mb-4">Agende sua prova teórica diretamente no site do DETRAN</p>
          <a 
            href={settings?.detran_url || 'https://goias.gov.br/detran/agendamento-detran/'} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/80">
              Agendar Prova no DETRAN
              <ExternalLink size={16} className="ml-2" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}