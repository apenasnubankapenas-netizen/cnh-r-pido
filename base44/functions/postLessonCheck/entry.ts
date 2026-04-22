import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function combineDateTime(dateStr, timeStr) {
  try {
    // timeStr expected as HH:MM
    const t = timeStr?.length === 5 ? `${timeStr}:00` : timeStr || '00:00:00';
    return new Date(`${dateStr}T${t}`);
  } catch {
    return new Date(dateStr);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar aulas agendadas que ainda não foram notificadas
    const lessons = await base44.asServiceRole.entities.Lesson.filter({ status: 'agendada' });
    const now = new Date();
    let processed = 0;

    for (const l of lessons) {
      if (l.notified) continue;
      const when = combineDateTime(l.date, l.time);
      if (!when || isNaN(when.getTime())) continue;

      if (when <= now) {
        // Enviar e-mail ao instrutor (se possuir e-mail vinculado)
        const instrArr = await base44.asServiceRole.entities.Instructor.filter({ id: l.instructor_id });
        const instr = instrArr[0];
        const to = instr?.user_email;
        if (to) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to,
            from_name: 'CNH PARA TODOS',
            subject: `Confirmação de aula: ${l.student_name} em ${l.date} ${l.time}`,
            body: `Olá ${instr.full_name || ''},\n\nA aula do aluno ${l.student_name} (${l.type}) em ${l.date} às ${l.time} já passou.\n\nPor favor, acesse o painel para marcar se o aluno compareceu ou faltou. Em caso de acidente/imprevisto, remarque gratuitamente um novo horário.\n\nAcesse: AdminLessons`,
          });
        }
        await base44.asServiceRole.entities.Lesson.update(l.id, { notified: true });
        processed += 1;
      }
    }

    return Response.json({ ok: true, processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});