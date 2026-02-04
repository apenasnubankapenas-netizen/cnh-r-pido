import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    // Fetch student data
    const students = await base44.entities.Student.filter({ id: studentId });
    if (students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }
    const student = students[0];

    // Fetch lessons for this student
    const lessons = await base44.entities.Lesson.filter({ student_id: studentId });
    
    // Fetch payments for this student
    const payments = await base44.entities.Payment.filter({ student_id: studentId });

    // Fetch app settings for lesson locations
    const settings = await base44.entities.AppSettings.list();
    const appSettings = settings.length > 0 ? settings[0] : {};

    // Create PDF with UTF-8 support
    const doc = new jsPDF({
      compress: false
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    const setFont = (size, weight = 'normal') => {
      doc.setFontSize(size);
      doc.setFont('courier', weight);
    };

    const addText = (text, x = 15, size = 10, weight = 'normal') => {
      setFont(size, weight);
      doc.text(text, x, yPosition);
      yPosition += size / 2 + 2;
    };

    const checkPageBreak = (space = 10) => {
      if (yPosition + space > pageHeight - 10) {
        doc.addPage();
        yPosition = 15;
      }
    };

    // Header
    setFont(18, 'bold');
    doc.setTextColor(240, 196, 27); // Amarelo
    doc.text('CNH PARA TODOS', 15, yPosition);
    yPosition += 8;

    // Title
    doc.setTextColor(0, 0, 0);
    setFont(14, 'bold');
    doc.text('Ficha do Aluno', 15, yPosition);
    yPosition += 8;

    doc.setDrawColor(240, 196, 27);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 5;

    // INFORMAÇÕES PESSOAIS
    setFont(11, 'bold');
    doc.setTextColor(30, 64, 175); // Azul
    addText('INFORMAÇÕES PESSOAIS');
    doc.setTextColor(0, 0, 0);
    
    const infoData = [
      [`Nome: ${student.full_name}`, `RENACH: ${student.renach}`],
      [`CPF: ${student.cpf}`, `Categoria: ${student.category}`],
      [`WhatsApp: ${student.whatsapp}`, `Telefone: ${student.phone || '-'}`],
      [`CEP: ${student.cep || '-'}`, `Rua: ${student.address_street || '-'}`],
      [`Bairro: ${student.address_neighborhood || '-'}`, `Cidade: ${student.address_city || '-'}`],
    ];

    checkPageBreak(20);
    infoData.forEach(([left, right]) => {
      setFont(9);
      doc.text(left, 15, yPosition);
      doc.text(right, pageWidth / 2, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // STATUS DO PROCESSO
    checkPageBreak(30);
    setFont(11, 'bold');
    doc.setTextColor(30, 64, 175);
    addText('STATUS DO PROCESSO');
    doc.setTextColor(0, 0, 0);

    const statusData = [
      `Exames Médicos: ${student.exam_done ? '✓ Concluído' : '✗ Pendente'}`,
      `Prova Teórica: ${student.theoretical_test_done ? '✓ Concluído' : '✗ Pendente'}`,
      `Prova Prática: ${student.practical_test_done ? '✓ Concluído' : '✗ Pendente'}`,
      `CNH Aprovada: ${student.cnh_approved ? '✓ Sim' : '✗ Não'}`,
      `Admin Confirmou Conclusão: ${student.admin_confirmed ? '✓ Sim' : '✗ Não'}`,
    ];

    statusData.forEach(status => {
      setFont(9);
      doc.text(status, 15, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // AULAS
    checkPageBreak(40);
    setFont(11, 'bold');
    doc.setTextColor(30, 64, 175);
    addText('AULAS AGENDADAS E REALIZADAS');
    doc.setTextColor(0, 0, 0);

    if (lessons.length > 0) {
      const sortedLessons = lessons.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      sortedLessons.forEach(lesson => {
        checkPageBreak(20);
        setFont(9, 'bold');
        const lessonType = lesson.type === 'carro' ? 'CARRO' : lesson.type === 'moto' ? 'MOTO' : lesson.type.toUpperCase();
        doc.text(`${lessonType} - ${new Date(lesson.date).toLocaleDateString('pt-BR')} às ${lesson.time}`, 15, yPosition);
        yPosition += 5;

        setFont(8);
        doc.text(`Instrutor: ${lesson.instructor_name}`, 18, yPosition);
        yPosition += 4;
        doc.text(`Status: ${lesson.status}`, 18, yPosition);
        yPosition += 4;

        const location = appSettings.lesson_locations?.[lesson.type];
        if (location?.address) {
          doc.text(`Local: ${location.address}`, 18, yPosition);
          yPosition += 4;
        }

        yPosition += 2;
      });
    } else {
      setFont(9);
      doc.text('Nenhuma aula registrada', 15, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // PAGAMENTOS
    checkPageBreak(40);
    setFont(11, 'bold');
    doc.setTextColor(30, 64, 175);
    addText('PAGAMENTOS REALIZADOS');
    doc.setTextColor(0, 0, 0);

    if (payments.length > 0) {
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      payments.forEach(payment => {
        checkPageBreak(15);
        setFont(9, 'bold');
        doc.text(`R$ ${payment.amount?.toFixed(2)} - ${payment.method.toUpperCase()}`, 15, yPosition);
        yPosition += 5;

        setFont(8);
        doc.text(`Status: ${payment.status}`, 18, yPosition);
        yPosition += 4;
        doc.text(`Descrição: ${payment.description || '-'}`, 18, yPosition);
        yPosition += 4;
        doc.text(`Data: ${new Date(payment.created_date).toLocaleDateString('pt-BR')}`, 18, yPosition);
        yPosition += 4;

        yPosition += 2;
      });

      yPosition += 5;
      setFont(10, 'bold');
      doc.text(`TOTAL PAGO: R$ ${totalPaid.toFixed(2)}`, 15, yPosition);
      yPosition += 6;
    } else {
      setFont(9);
      doc.text('Nenhum pagamento registrado', 15, yPosition);
      yPosition += 6;
    }

    // Footer
    checkPageBreak(20);
    doc.setDrawColor(240, 196, 27);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 5;

    setFont(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, 15, yPosition);

    // Generate PDF as bytes
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="aluno_${student.full_name.replace(/\s+/g, '_')}.pdf"`
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});