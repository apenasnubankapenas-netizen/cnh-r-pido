import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

export default function StudentContractModal({ student, settings, onAccept, onReject, isLoading }) {
  const [accepted, setAccepted] = useState(false);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${today}`, 20, yPos);
    yPos += 10;

    // Student Info
    doc.setFont(undefined, 'bold');
    doc.text('INFORMAÇÕES DO ALUNO:', 20, yPos);
    yPos += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(`Aluno: ${student.full_name || 'N/A'}`, 25, yPos);
    yPos += 6;
    doc.text(`CPF: ${student.cpf || 'N/A'}`, 25, yPos);
    yPos += 6;
    doc.text(`Categoria: ${student.category || 'N/A'}`, 25, yPos);
    yPos += 6;
    
    // Calculate contract value
    let contractValue = 0;
    if (settings) {
      if (student.category === 'A') contractValue = settings.category_a_price || 548;
      else if (student.category === 'B') contractValue = settings.category_b_price || 548;
      else if (student.category === 'AB') contractValue = settings.category_ab_price || 992;
      else if (student.category === 'inclusao_A') contractValue = settings.category_inclusao_a_price || 400;
      else if (student.category === 'inclusao_B') contractValue = settings.category_inclusao_b_price || 400;
      else if (student.category === 'onibus') contractValue = settings.category_bus_price || 1500;
      else if (student.category === 'caminhao') contractValue = settings.category_truck_price || 1800;
      else if (student.category === 'carreta') contractValue = settings.category_trailer_price || 2200;
    }

    doc.text(`Valor do Contrato: R$ ${contractValue.toFixed(2)}`, 25, yPos);
    yPos += 12;

    // Contract text
    doc.setFont(undefined, 'bold');
    doc.text('TERMOS E CONDIÇÕES:', 20, yPos);
    yPos += 7;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    const contractText = [
      '1. O contratante aceita os termos de prestação de serviços de aulas de direção conforme',
      'apresentado pela instituição.',
      '',
      '2. O aluno compromete-se a cumprir as regras de segurança, horários marcados e',
      'pagamento das aulas contratadas.',
      '',
      '3. A instituição fornecerá aulas teóricas e práticas conforme programação acordada.',
      '',
      '4. O pagamento deve ser realizado conforme cronograma estabelecido.',
      '',
      '5. Este contrato é válido até a conclusão do curso ou cancelamento mútuo.'
    ];

    contractText.forEach(line => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos, { maxWidth: pageWidth - 40 });
      yPos += 5;
    });

    yPos += 15;

    // Signature area
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Assinatura do Aluno: ________________________', 20, yPos);
    yPos += 15;
    doc.text('Data: ________________________', 20, yPos);

    // Download PDF
    const filename = `contrato_${(student.full_name || 'aluno').replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(filename);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#fbbf24] text-xl">Contrato de Prestação de Serviços</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info Summary */}
          <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
            <h3 className="font-bold text-[#fbbf24] mb-3">Informações do Aluno:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Aluno:</span>
                <span className="font-semibold">{student.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">CPF:</span>
                <span className="font-semibold">{student.cpf || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Categoria:</span>
                <span className="font-semibold text-[#f0c41b]">{student.category || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Valor do Contrato:</span>
                <span className="font-semibold text-[#f0c41b]">
                  R$ {(() => {
                    if (!settings) return '0,00';
                    if (student.category === 'A') return (settings.category_a_price || 548).toFixed(2);
                    if (student.category === 'B') return (settings.category_b_price || 548).toFixed(2);
                    if (student.category === 'AB') return (settings.category_ab_price || 992).toFixed(2);
                    if (student.category === 'inclusao_A') return (settings.category_inclusao_a_price || 400).toFixed(2);
                    if (student.category === 'inclusao_B') return (settings.category_inclusao_b_price || 400).toFixed(2);
                    if (student.category === 'onibus') return (settings.category_bus_price || 1500).toFixed(2);
                    if (student.category === 'caminhao') return (settings.category_truck_price || 1800).toFixed(2);
                    if (student.category === 'carreta') return (settings.category_trailer_price || 2200).toFixed(2);
                    return '0,00';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Data:</span>
                <span className="font-semibold">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Contract Text */}
          <div className="p-4 bg-[#111827] rounded-lg border border-[#374151] space-y-3 max-h-64 overflow-y-auto">
            <h3 className="font-bold text-[#fbbf24] text-sm">Termos e Condições:</h3>
            <div className="text-xs text-[#e6edf3] space-y-2 leading-relaxed">
              <p>1. O contratante aceita os termos de prestação de serviços de aulas de direção conforme apresentado pela instituição.</p>
              <p>2. O aluno compromete-se a cumprir as regras de segurança, horários marcados e pagamento das aulas contratadas.</p>
              <p>3. A instituição fornecerá aulas teóricas e práticas conforme programação acordada.</p>
              <p>4. O pagamento deve ser realizado conforme cronograma estabelecido.</p>
              <p>5. Este contrato é válido até a conclusão do curso ou cancelamento mútuo.</p>
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-[#0d1117] rounded-lg border border-[#374151]">
            <Checkbox 
              checked={accepted}
              onCheckedChange={setAccepted}
              className="mt-1"
            />
            <label className="text-xs text-[#e6edf3] cursor-pointer flex-1">
              Declaro que li e aceito os termos do contrato de prestação de serviços acima descrito.
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            className="border-[#374151] h-10 flex-1 sm:flex-none"
            onClick={onReject}
            disabled={isLoading}
          >
            Rejeitar
          </Button>
          <Button 
            variant="outline" 
            className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/10 h-10 flex-1 sm:flex-none"
            onClick={generatePDF}
            disabled={!accepted || isLoading}
          >
            <Download className="mr-2" size={16} />
            Baixar PDF
          </Button>
          <Button 
            className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] h-10 flex-1 sm:flex-none"
            onClick={onAccept}
            disabled={!accepted || isLoading}
          >
            {isLoading ? 'Processando...' : 'Aceitar e Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}