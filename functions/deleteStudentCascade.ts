import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas Super Admin (mesmo critério usado no app)
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

    // Coleta e apaga dados relacionados
    const lessons = await base44.asServiceRole.entities.Lesson.filter({ student_id: studentId });
    for (const l of lessons) {
      await base44.asServiceRole.entities.Lesson.delete(l.id);
    }

    const payments = await base44.asServiceRole.entities.Payment.filter({ student_id: studentId });
    for (const p of payments) {
      await base44.asServiceRole.entities.Payment.delete(p.id);
    }

    const conversations = await base44.asServiceRole.entities.Conversation.filter({ student_id: studentId });
    let messagesDeleted = 0;
    for (const c of conversations) {
      const msgs = await base44.asServiceRole.entities.ChatMessage.filter({ conversation_id: c.id });
      for (const m of msgs) {
        await base44.asServiceRole.entities.ChatMessage.delete(m.id);
        messagesDeleted++;
      }
      await base44.asServiceRole.entities.Conversation.delete(c.id);
    }

    const reviews = await base44.asServiceRole.entities.InstructorReview.filter({ student_id: studentId });
    for (const r of reviews) {
      await base44.asServiceRole.entities.InstructorReview.delete(r.id);
    }

    const comments = await base44.asServiceRole.entities.InstructorComment.filter({ student_id: studentId });
    for (const c of comments) {
      await base44.asServiceRole.entities.InstructorComment.delete(c.id);
    }

    // Apaga posts de instrutor ligados ao aluno (se houver)
    // Também remove student da conversa em AdminChats via deleção de conversas acima

    // Por último, apaga o aluno
    await base44.asServiceRole.entities.Student.delete(studentId);

    return Response.json({
      success: true,
      deleted: {
        lessons: lessons.length,
        payments: payments.length,
        conversations: conversations.length,
        messages: messagesDeleted,
        reviews: reviews.length,
        comments: comments.length
      }
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});