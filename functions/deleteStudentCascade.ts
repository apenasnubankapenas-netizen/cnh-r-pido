import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas Super Admin
    if (user.email !== 'tcnhpara@gmail.com') {
      return Response.json({ error: 'Forbidden: Super admin only' }, { status: 403 });
    }

    const body = await req.json();
    const studentId = body?.studentId;

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    // Verifica existência do aluno
    const students = await base44.asServiceRole.entities.Student.filter({ id: studentId });
    if (!students || students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = students[0];
    let counts = { lessons: 0, payments: 0, conversations: 0, messages: 0, reviews: 0, comments: 0 };

    // 1. Apagar TODAS as aulas (incluindo trial) pelo student_id
    const lessons = await base44.asServiceRole.entities.Lesson.filter({ student_id: studentId });
    for (const l of lessons) {
      await base44.asServiceRole.entities.Lesson.delete(l.id);
      counts.lessons++;
    }

    // 2. Apagar também aulas pelo student_renach (caso existam com renach mas sem student_id correto)
    if (student.renach) {
      const lessonsByRenach = await base44.asServiceRole.entities.Lesson.filter({ student_renach: student.renach });
      for (const l of lessonsByRenach) {
        // Evitar apagar duplicado se já foi apagado acima
        try {
          await base44.asServiceRole.entities.Lesson.delete(l.id);
          counts.lessons++;
        } catch (_) {}
      }
    }

    // 3. Apagar todos os pagamentos
    const payments = await base44.asServiceRole.entities.Payment.filter({ student_id: studentId });
    for (const p of payments) {
      await base44.asServiceRole.entities.Payment.delete(p.id);
      counts.payments++;
    }

    // 4. Apagar conversas e todas as mensagens dentro delas
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ student_id: studentId });
    for (const c of conversations) {
      const msgs = await base44.asServiceRole.entities.ChatMessage.filter({ conversation_id: c.id });
      for (const m of msgs) {
        await base44.asServiceRole.entities.ChatMessage.delete(m.id);
        counts.messages++;
      }
      await base44.asServiceRole.entities.Conversation.delete(c.id);
      counts.conversations++;
    }

    // 5. Apagar também conversas pelo student_email caso existam
    if (student.user_email) {
      const convsByEmail = await base44.asServiceRole.entities.Conversation.filter({ student_email: student.user_email });
      for (const c of convsByEmail) {
        const msgs = await base44.asServiceRole.entities.ChatMessage.filter({ conversation_id: c.id });
        for (const m of msgs) {
          try { await base44.asServiceRole.entities.ChatMessage.delete(m.id); counts.messages++; } catch (_) {}
        }
        try { await base44.asServiceRole.entities.Conversation.delete(c.id); counts.conversations++; } catch (_) {}
      }
    }

    // 6. Apagar avaliações de instrutores feitas pelo aluno
    const reviews = await base44.asServiceRole.entities.InstructorReview.filter({ student_id: studentId });
    for (const r of reviews) {
      await base44.asServiceRole.entities.InstructorReview.delete(r.id);
      counts.reviews++;
    }

    // 7. Apagar comentários de instrutores feitos pelo aluno
    const comments = await base44.asServiceRole.entities.InstructorComment.filter({ student_id: studentId });
    for (const c of comments) {
      await base44.asServiceRole.entities.InstructorComment.delete(c.id);
      counts.comments++;
    }

    // 8. Por último, apagar o aluno
    await base44.asServiceRole.entities.Student.delete(studentId);

    return Response.json({ success: true, deleted: counts });

  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});