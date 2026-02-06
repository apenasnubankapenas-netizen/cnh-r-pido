import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TodayLessonsManager({ lessons, instructorId, onLessonUpdate }) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPhase, setPhotoPhase] = useState(null); // 'start' ou 'end'
  const [instructorPhoto, setInstructorPhoto] = useState(null);
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const openPhotoModal = (lesson, phase) => {
    setSelectedLesson(lesson);
    setPhotoPhase(phase);
    setInstructorPhoto(null);
    setStudentPhoto(null);
    setError('');
    setShowPhotoModal(true);
  };

  const handlePhotoCapture = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (type === 'instructor') {
          setInstructorPhoto(file_url);
        } else {
          setStudentPhoto(file_url);
        }
      } catch (err) {
        setError('Erro ao fazer upload da foto');
      }
    }
  };

  const submitPhotos = async () => {
    if (!instructorPhoto || !studentPhoto) {
      setError('Você deve enviar a foto do instrutor e do aluno');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      if (photoPhase === 'start') {
        updateData.start_instructor_photo_url = instructorPhoto;
        updateData.start_student_photo_url = studentPhoto;
        updateData.start_photos_timestamp = new Date().toISOString();
      } else {
        updateData.end_instructor_photo_url = instructorPhoto;
        updateData.end_student_photo_url = studentPhoto;
        updateData.end_photos_timestamp = new Date().toISOString();
      }

      await base44.entities.Lesson.update(selectedLesson.id, updateData);
      setShowPhotoModal(false);
      setSuccessMsg(photoPhase === 'start' ? 'Aula iniciada com sucesso!' : 'Aula finalizada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onLessonUpdate?.();
    } catch (err) {
      setError('Erro ao salvar fotos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (lesson, status) => {
    if (!lesson.start_instructor_photo_url || !lesson.start_student_photo_url) {
      setError('Você não enviou a foto de inicialização da aula');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!lesson.end_instructor_photo_url || !lesson.end_student_photo_url) {
      setError('Você não enviou a foto de término da aula');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        status: status === 'presenca' ? 'realizada' : 'falta'
      };

      await base44.entities.Lesson.update(lesson.id, updateData);

      if (status === 'falta') {
        const student = await base44.entities.Student.filter({ id: lesson.student_id });
        if (student.length > 0) {
          await base44.entities.Student.update(lesson.student_id, {
            completed_car_lessons: (student[0].completed_car_lessons || 0),
            completed_moto_lessons: (student[0].completed_moto_lessons || 0)
          });
        }
      }

      setSuccessMsg(status === 'presenca' ? 'Presença confirmada!' : 'Falta registrada!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onLessonUpdate?.();
    } catch (err) {
      setError('Erro ao registrar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const todayLessons = lessons.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.date === today && l.status === 'agendada';
  }).sort((a, b) => a.time.localeCompare(b.time));

  if (todayLessons.length === 0) {
    return (
      <div className="text-center py-8 text-white">
        <AlertCircle className="mx-auto mb-2 text-[#fbbf24]" size={32} />
        <p>Nenhuma aula agendada para hoje</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="text-green-400 text-sm">{successMsg}</p>
        </div>
      )}

      <div className="space-y-3">
        {todayLessons.map((lesson) => (
          <Card key={lesson.id} className="bg-[#111827] border-[#374151]">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Info da aula */}
                <div className="flex items-start gap-3">
                  <div className="text-center min-w-[70px]">
                    <p className="font-bold text-[#fbbf24] text-lg">{lesson.time}</p>
                    <p className="text-xs text-[#9ca3af]">
                      {lesson.type === 'carro' ? '🚗' : '🏍️'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-white">{lesson.student_name}</p>
                    <p className="text-xs text-[#9ca3af]">RENACH: {lesson.student_renach}</p>
                    <div className="flex gap-2 mt-2">
                      {lesson.start_instructor_photo_url && (
                        <Badge className="bg-blue-500/20 text-blue-400">Iniciado</Badge>
                      )}
                      {lesson.end_instructor_photo_url && (
                        <Badge className="bg-green-500/20 text-green-400">Finalizado</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col gap-2">
                  {!lesson.start_instructor_photo_url ? (
                    <Button
                      onClick={() => openPhotoModal(lesson, 'start')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={loading}
                    >
                      <Camera size={16} className="mr-1" />
                      Iniciar Aula
                    </Button>
                  ) : !lesson.end_instructor_photo_url ? (
                    <Button
                      onClick={() => openPhotoModal(lesson, 'end')}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={loading}
                    >
                      <Camera size={16} className="mr-1" />
                      Finalizar Aula
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => markAttendance(lesson, 'presenca')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                        disabled={loading}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        PRESENÇA
                      </Button>
                      <Button
                        onClick={() => markAttendance(lesson, 'falta')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                        disabled={loading}
                      >
                        <XCircle size={16} className="mr-1" />
                        FALTA
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Fotos */}
      {showPhotoModal && (
        <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
          <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-md">
            <DialogHeader>
              <DialogTitle>
                {photoPhase === 'start' ? 'Iniciar Aula' : 'Finalizar Aula'}
              </DialogTitle>
              <p className="text-sm text-[#9ca3af] mt-2">
                {selectedLesson?.student_name} - {selectedLesson?.time}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Foto do Instrutor */}
              <div className="border-2 border-dashed border-[#374151] rounded-lg p-4 text-center">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handlePhotoCapture(e, 'instructor')}
                    className="hidden"
                  />
                  {instructorPhoto ? (
                    <div>
                      <CheckCircle className="mx-auto text-green-400 mb-2" size={24} />
                      <p className="text-sm text-green-400">Selfie do Instrutor ✓</p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="mx-auto text-[#fbbf24] mb-2" size={24} />
                      <p className="text-sm text-[#9ca3af]">Clique para fotografar</p>
                      <p className="text-xs text-[#9ca3af]">Sua Selfie</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Foto do Aluno */}
              <div className="border-2 border-dashed border-[#374151] rounded-lg p-4 text-center">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoCapture(e, 'student')}
                    className="hidden"
                  />
                  {studentPhoto ? (
                    <div>
                      <CheckCircle className="mx-auto text-green-400 mb-2" size={24} />
                      <p className="text-sm text-green-400">Foto do Aluno ✓</p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="mx-auto text-[#fbbf24] mb-2" size={24} />
                      <p className="text-sm text-[#9ca3af]">Clique para fotografar</p>
                      <p className="text-xs text-[#9ca3af]">Foto do Aluno</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setShowPhotoModal(false)}
                  className="flex-1 bg-[#374151] hover:bg-[#4a4a4a]"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={submitPhotos}
                  className="flex-1 bg-[#fbbf24] hover:bg-[#d4aa00] text-black font-bold"
                  disabled={loading || !instructorPhoto || !studentPhoto}
                >
                  {loading ? 'Enviando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}