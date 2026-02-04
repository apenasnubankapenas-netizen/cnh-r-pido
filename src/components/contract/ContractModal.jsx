import React, { useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function ContractModal({ 
  student, 
  settings, 
  onAccept, 
  onReject,
  isLoading 
}) {
  const scrollRef = useRef(null);

  const getSelectedCategory = () => {
    const categories = {
      A: 'Categoria A',
      B: 'Categoria B',
      AB: 'Categoria AB',
      inclusao_A: 'Inclusão A',
      inclusao_B: 'Inclusão B',
      onibus: 'Ônibus',
      carreta: 'Carreta'
    };
    return categories[student?.category] || student?.category;
  };

  const calculateCategoryPrice = () => {
    if (!settings) return '0,00';
    const priceMap = {
      A: settings.category_a_price,
      B: settings.category_b_price,
      AB: settings.category_ab_price,
      inclusao_A: settings.category_inclusao_a_price,
      inclusao_B: settings.category_inclusao_b_price,
      onibus: settings.category_bus_price,
      carreta: settings.category_trailer_price,
    };
    const price = priceMap[student?.category] || 0;
    return price.toFixed(2).replace('.', ',');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2332] border-2 border-[#fbbf24] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#374151] p-4 flex items-center justify-between bg-gradient-to-r from-[#0969da] to-[#0550ae]">
          <h2 className="text-xl font-bold text-white">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
          <button className="text-white hover:text-[#fbbf24]">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-white">
          <div className="text-center mb-4">
            <p className="font-bold">Centro de Formação de Condutores</p>
            <p className="text-xs text-[#9ca3af]">CFC - Contrato de Prestação de Serviços</p>
          </div>

          <div className="bg-[#111827] border border-[#374151] p-4 rounded space-y-2 text-xs">
            <p><span className="text-[#fbbf24] font-bold">Aluno:</span> {student?.full_name}</p>
            <p><span className="text-[#fbbf24] font-bold">CPF:</span> {student?.cpf}</p>
            <p><span className="text-[#fbbf24] font-bold">Categoria:</span> {getSelectedCategory()}</p>
            <p><span className="text-[#fbbf24] font-bold">Valor do Contrato:</span> R$ {calculateCategoryPrice()}</p>
            <p><span className="text-[#fbbf24] font-bold">Data:</span> {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="space-y-3">
            <p className="font-bold text-[#fbbf24]">1°</p>
            <p className="text-justify leading-relaxed">
              Deixo espontaneamente em poder da empresa Centro de Formação de Condutores, CONTRATADO, cópias de minha documentação pessoal e do comprovante de endereço, caso necessite, como objetivo de instruir cadastramento do processo para Carteira Nacional de Habilitação/CNH, de categoria por mim informada. Estou ciente de que, em caso de transferência ou se eu não der andamento ao processo, será cobrado o valor da matrícula no importe de R$ 100,00 (cem reais), não havendo devolução desse valor. Assim como, em caso de DESISTÊNCIA de uma das Categorias pretendida, pagarei ao CFC, os honorários devidos como forma de prestação de serviços, para que este, atue junto ao Detran/GO, para emissão somente da categoria pretendida. Estou ciente ainda, que, tenho o dever de não deixar o meu processo INERTE (parado) por mais de 6 meses, e que devo fazer contato com a autoescola.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">2°</p>
            <p className="text-justify leading-relaxed">
              Caso haja reajuste nas taxas do DETRAN no exame médico e psicotécnico os valores ficam por conta do CONTRATANTE.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">3°</p>
            <p className="text-justify leading-relaxed">
              O contratante que contratar os serviços teóricos terá o agendamento da prova incluso no valor. Caso opte por não contratar os serviços teóricos, será de sua responsabilidade realizar o agendamento da prova pelo aplicativo CNH do Brasil ou pelo site do DETRAN, ou efetuar o pagamento de honorários para que a contratada realize a marcação da prova.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">3° (Continuação)</p>
            <p className="text-justify leading-relaxed">
              O Curso Teórico será ministrado no CFC, nas datas e horários definidos pelo mesmo. Ao término das aulas do Curso Teórico, o aluno deverá comparecer ao CFC, para assinar o livro do dia da prova de Legislação de trânsito. É obrigação do aluno ligar para o CFC no horário de atendimento para confirmar o local e horário de prova. Os candidatos que fizerem o curso teórico pelo aplicativo CNH do Brasil não precisarão realizá-lo no CFC.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">4°</p>
            <p className="text-justify leading-relaxed">
              A duração da aula de direção veicular será de CINQUENTA minutos, em caso de FALTAS, as aulas serão cobradas. Após o término das aulas práticas, o aluno que contratou a locação do veículo para a prova prática deverá comparecer ao CFC para realizar o agendamento da Prova Prática.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">5°</p>
            <p className="text-justify leading-relaxed">
              Em caso de reprovação nas PROVAS DE LEGISLAÇÃO (prova escrita) OU PROVA PRÁTICA DE DIREÇÃO deverá ser pago DUA do DETRAN (taxa de agendamento) + Honorários da empresa e locação do veículo de acordo com a tabela do dia atual fixada na empresa. As marcações de aulas e provas serão feitas pelo aluno na empresa, não será aceito marcações por telefone. Obs: Em caso de agendamento por parte do cliente no DETRAN para emitir LADV, o aluno deverá pagar os honorários referidos.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">6°</p>
            <p className="text-justify leading-relaxed">
              O Detran não aceita atestado médicos para desmarcação de prova teórica e para prática. Após a banca sair do sistema não será possível fazer a desmarcação ou qualquer alteração. E de responsabilidade do aluno está em mãos no momento da prova com os documentos de identidade sendo RG e CPF legível, com Validade de 10 Anos.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">7°</p>
            <p className="text-justify leading-relaxed">
              Caso o contratante opte por não utilizar o veículo da autoescola para a realização da prova prática, será de sua inteira responsabilidade realizar o agendamento da prova junto ao DETRAN, bem como se responsabilizar por todas as providências, custos e obrigações decorrentes.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">8°</p>
            <p className="text-justify leading-relaxed">
              Declaro estar ciente que as aulas práticas agendadas, na hipótese de não comparecimento às aulas, terei de desmarcá-las com no mínimo vinte e quatro horas de antecedência, em horário comercial, do contrário pagarei o valor de tabela e reagendar as mesmas. Em condições de doença apresentarei atestado médico. O atestado Médico será aceito até 48 horas após a falta. Estou ciente também que sempre terei estar com vestuário e calçados de acordo com a legislação de trânsito vigente.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">9°</p>
            <p className="text-justify leading-relaxed">
              Este contrato poderá ser rescindido voluntariamente por iniciativa do CONTRATANTE — aluno(a), mediante as seguintes condições, pagará para o CFC os serviços já prestados e multa de rescisória na ordem de 30% (trinta por cento) sobre o valor total do contrato, sobre as aulas práticas, teóricas e honorários.
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">10°</p>
            <p className="text-justify leading-relaxed">
              O valor do presente contrato de prestação de serviço pela {getSelectedCategory()} é de R$ {calculateCategoryPrice()} (não inclusos taxas do DETRAN, exames médicos e/ou psicológico, retestes, ou taxas do DETRAN-GO)
            </p>

            <p className="font-bold text-[#fbbf24] mt-4">11°</p>
            <p className="text-justify leading-relaxed">
              Toda a aula prática de carro terá início e término no endereço do CFC.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#374151] p-4 space-y-3 bg-[#111827]">
          <div className="flex items-center gap-3">
            <Checkbox 
              id="accept-contract"
              className="border-[#fbbf24]"
            />
            <label htmlFor="accept-contract" className="text-sm text-white cursor-pointer">
              Concordo com todos os termos e condições deste contrato
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10"
              onClick={onReject}
              disabled={isLoading}
            >
              Recusar
            </Button>
            <Button
              className="flex-1 bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
              onClick={onAccept}
              disabled={isLoading}
            >
              <Check size={18} className="mr-2" />
              Aceitar Contrato
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}