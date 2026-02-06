import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle,
  Upload,
  Send,
  X,
  Edit,
  Calendar
} from 'lucide-react';
import InstructorSchedule from "../components/instructor/InstructorSchedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function InstructorProfile() {
  const navigate = useNavigate();
  const instructorId = new URLSearchParams(window.location.search).get('id');
  const [user, setUser] = useState(null);
  const [instructor, setInstructor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postData, setPostData] = useState({ image_url: '', caption: '' });
  const [postFile, setPostFile] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [lessons, setLessons] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadData();
  }, [instructorId]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Determinar tipo de usuário
      if (currentUser?.role === 'user') {
        const students = await base44.entities.Student.filter({ user_email: currentUser.email });
        if (students.length > 0) setUserType('student');
      } else if (currentUser?.role === 'admin') {
        if (currentUser.email === 'tcnhpara@gmail.com') {
          setUserType('superadmin');
        } else {
          const instructors = await base44.entities.Instructor.filter({ user_email: currentUser.email });
          if (instructors.length > 0 && instructors[0].active) {
            setUserType('instructor');
          } else {
            const sellers = await base44.entities.Seller.filter({ email: currentUser.email });
            if (sellers.length > 0 && sellers[0].active) {
              setUserType('seller');
            } else {
              setUserType('admin');
            }
          }
        }
      }

      // Se não passou ID, buscar o instrutor do usuário logado
      let targetInstructorId = instructorId;
      if (!targetInstructorId && currentUser?.role === 'admin') {
        const instructors = await base44.entities.Instructor.filter({ user_email: currentUser.email });
        if (instructors.length > 0) {
          targetInstructorId = instructors[0].id;
        }
      }

      const [instructorData, postsData, commentsData, lessonsData, settingsData] = await Promise.all([
        targetInstructorId ? base44.entities.Instructor.filter({ id: targetInstructorId }) : Promise.resolve([]),
        targetInstructorId ? base44.entities.InstructorPost.filter({ instructor_id: targetInstructorId }) : Promise.resolve([]),
        targetInstructorId ? base44.entities.InstructorComment.filter({ instructor_id: targetInstructorId }) : Promise.resolve([]),
        targetInstructorId ? base44.entities.Lesson.filter({ instructor_id: targetInstructorId }) : Promise.resolve([]),
        base44.entities.AppSettings.list()
      ]);

      if (instructorData.length > 0) {
        setInstructor(instructorData[0]);
      }
      setPosts(postsData || []);
      setComments(commentsData || []);
      
      // Para ganhos: apenas aulas realizadas
      // Para mapa: todas as aulas (agendadas, realizadas, etc)
      setLessons(lessonsData || []);
      
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setPostData({ ...postData, image_url: file_url });
        setPostFile(file);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!postData.image_url && !postData.caption) return;
    try {
      await base44.entities.InstructorPost.create({
        instructor_id: instructor.id,
        instructor_name: instructor.full_name,
        image_url: postData.image_url || null,
        caption: postData.caption || ''
      });
      setPostData({ image_url: '', caption: '' });
      setPostFile(null);
      setShowPostDialog(false);
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      await base44.entities.InstructorComment.create({
        instructor_id: instructor.id,
        student_id: user?.id || 'anonimo',
        student_name: user?.full_name || 'Anônimo',
        comment: commentText
      });
      setCommentText('');
      setSelectedPost(null);
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const canCreatePost = userType === 'superadmin' && instructor?.user_email === user?.email;
  
  // Calcular ganhos (apenas aulas realizadas)
  const realizedLessons = lessons.filter(l => l.status === 'realizada' && !l.trial);
  const carLessons = realizedLessons.filter(l => l.type === 'carro').length;
  const motoLessons = realizedLessons.filter(l => l.type === 'moto').length;
  const busLessons = realizedLessons.filter(l => l.type === 'onibus').length;
  const truckLessons = realizedLessons.filter(l => l.type === 'caminhao').length;
  const trailerLessons = realizedLessons.filter(l => l.type === 'carreta').length;
  
  const carEarnings = carLessons * (settings?.instructor_car_commission || 12);
  const motoEarnings = motoLessons * (settings?.instructor_moto_commission || 7);
  const busEarnings = busLessons * (settings?.instructor_bus_commission || 15);
  const truckEarnings = truckLessons * (settings?.instructor_truck_commission || 15);
  const trailerEarnings = trailerLessons * (settings?.instructor_trailer_commission || 20);
  
  const totalEarnings = carEarnings + motoEarnings + busEarnings + truckEarnings + trailerEarnings;
  
  // Verificar se é o próprio instrutor visualizando
  const isOwnProfile = instructor?.user_email === user?.email;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white">Instrutor não encontrado</p>
      </div>
    );
  }

  const postsByInstructor = posts.filter(p => p.instructor_id === instructor.id);
  const commentsByInstructor = comments.filter(c => c.instructor_id === instructor.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold text-white">{instructor.full_name}</h1>
      </div>

      {/* Capa */}
      <div className="h-48 bg-gradient-to-r from-[#0969da] to-[#f0c41b] rounded-lg mb-4 relative overflow-hidden">
        {instructor.cover_photo ? (
          <img src={instructor.cover_photo} alt="capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-opacity-30">
            Foto de capa
          </div>
        )}
      </div>

      {/* Perfil e Info */}
      <Card className="bg-[#1a2332] border-[#374151] mb-6">
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Foto de Perfil */}
            <div className="w-32 h-32 rounded-full bg-[#111827] flex items-center justify-center overflow-hidden -mt-20 border-4 border-[#1a2332]">
              {instructor.photo ? (
                <img src={instructor.photo} alt={instructor.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-[#fbbf24]">
                  {instructor.full_name?.charAt(0)}
                </span>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{instructor.full_name}</h2>
              
              <div className="space-y-2 text-sm text-white mb-4">
                {instructor.phone && (
                  <p>📱 {instructor.phone}</p>
                )}
                {instructor.teaches_car && <p>🚗 Aulas de Carro</p>}
                {instructor.teaches_moto && <p>🏍️ Aulas de Moto</p>}
                {instructor.teaches_bus && <p>🚌 Aulas de Ônibus</p>}
              </div>

              {instructor.bio && (
                <p className="text-[#e6edf3] text-sm mb-4">{instructor.bio}</p>
              )}

              {/* Botão WhatsApp para alunos */}
              {userType === 'student' && instructor.whatsapp_link && (
                <a href={instructor.whatsapp_link} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700 mb-3">
                    <MessageCircle size={16} className="mr-2" />
                    Conversar no WhatsApp
                  </Button>
                </a>
              )}

              {canCreatePost && (
                <Button 
                  className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
                  onClick={() => setShowPostDialog(true)}
                  size="sm"
                >
                  <Upload className="mr-2" size={16} />
                  Novo Post
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa de Aulas - Apenas para o próprio instrutor */}
      {isOwnProfile && (
        <Card className="bg-[#1a2332] border-[#374151] mb-6">
          <CardHeader>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="text-[#fbbf24]" />
              Mapa de Aulas (Próximos 14 dias)
            </h3>
          </CardHeader>
          <CardContent>
            <InstructorSchedule lessons={lessons.filter(l => l.status === 'agendada')} />
          </CardContent>
        </Card>
      )}

      {/* Ganhos e Estatísticas - Apenas para o próprio instrutor */}
      {isOwnProfile && (
        <Card className="bg-[#1a2332] border-[#374151] mb-6">
          <CardHeader>
            <h3 className="text-lg font-bold text-white">💰 Meus Ganhos</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-[#111827] rounded-lg">
                <p className="text-xs text-[#9ca3af] mb-1">🚗 Aulas de Carro</p>
                <p className="text-xl font-bold text-white">{carLessons}</p>
                <p className="text-sm text-[#fbbf24]">R$ {carEarnings.toFixed(2)}</p>
                <p className="text-xs text-[#9ca3af]">R$ {settings?.instructor_car_commission || 12}/aula</p>
              </div>
              <div className="p-3 bg-[#111827] rounded-lg">
                <p className="text-xs text-[#9ca3af] mb-1">🏍️ Aulas de Moto</p>
                <p className="text-xl font-bold text-white">{motoLessons}</p>
                <p className="text-sm text-[#fbbf24]">R$ {motoEarnings.toFixed(2)}</p>
                <p className="text-xs text-[#9ca3af]">R$ {settings?.instructor_moto_commission || 7}/aula</p>
              </div>
              {busLessons > 0 && (
                <div className="p-3 bg-[#111827] rounded-lg">
                  <p className="text-xs text-[#9ca3af] mb-1">🚌 Aulas de Ônibus</p>
                  <p className="text-xl font-bold text-white">{busLessons}</p>
                  <p className="text-sm text-[#fbbf24]">R$ {busEarnings.toFixed(2)}</p>
                  <p className="text-xs text-[#9ca3af]">R$ {settings?.instructor_bus_commission || 15}/aula</p>
                </div>
              )}
              {truckLessons > 0 && (
                <div className="p-3 bg-[#111827] rounded-lg">
                  <p className="text-xs text-[#9ca3af] mb-1">🚚 Aulas de Caminhão</p>
                  <p className="text-xl font-bold text-white">{truckLessons}</p>
                  <p className="text-sm text-[#fbbf24]">R$ {truckEarnings.toFixed(2)}</p>
                  <p className="text-xs text-[#9ca3af]">R$ {settings?.instructor_truck_commission || 15}/aula</p>
                </div>
              )}
              {trailerLessons > 0 && (
                <div className="p-3 bg-[#111827] rounded-lg">
                  <p className="text-xs text-[#9ca3af] mb-1">🚛 Aulas de Carreta</p>
                  <p className="text-xl font-bold text-white">{trailerLessons}</p>
                  <p className="text-sm text-[#fbbf24]">R$ {trailerEarnings.toFixed(2)}</p>
                  <p className="text-xs text-[#9ca3af]">R$ {settings?.instructor_trailer_commission || 20}/aula</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-gradient-to-r from-[#0969da] to-[#f0c41b] rounded-lg">
              <p className="text-sm text-white/80 mb-1">Total Ganho</p>
              <p className="text-3xl font-bold text-white">R$ {totalEarnings.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {postsByInstructor.length > 0 ? (
          postsByInstructor.map((post) => (
            <Card key={post.id} className="bg-[#1a2332] border-[#374151]">
              <CardContent className="p-4">
                {/* Post Image */}
                {post.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden max-h-96">
                    <img src={post.image_url} alt="post" className="w-full object-cover" />
                  </div>
                )}

                {/* Caption */}
                {post.caption && (
                  <p className="text-white mb-3">{post.caption}</p>
                )}

                {/* Likes and Comments Button */}
                <div className="flex gap-3 text-sm text-[#9ca3af] mb-3 border-b border-[#374151] pb-3">
                  <button className="flex items-center gap-1 hover:text-[#fbbf24]">
                    <Heart size={16} />
                    {post.likes_count || 0}
                  </button>
                  <button 
                    onClick={() => setSelectedPost(post.id)}
                    className="flex items-center gap-1 hover:text-[#fbbf24]"
                  >
                    <MessageCircle size={16} />
                    {commentsByInstructor.filter(c => c.comment && c.comment.includes(post.id)).length}
                  </button>
                </div>

                {/* Comments */}
                <div className="space-y-2 mb-3">
                  {commentsByInstructor
                    .filter(c => !c.rating) // Mostrar apenas comentários de usuários, não reviews
                    .slice(0, 3)
                    .map((comment) => (
                      <div key={comment.id} className="text-sm">
                        <span className="font-semibold text-white">{comment.student_name}</span>
                        <p className="text-[#9ca3af]">{comment.comment}</p>
                      </div>
                    ))}
                </div>

                {/* Comment Input */}
                {userType === 'student' && (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Adicionar comentário..."
                      className="bg-[#111827] border-[#374151] text-white text-sm"
                      value={selectedPost === post.id ? commentText : ''}
                      onChange={(e) => {
                        setSelectedPost(post.id);
                        setCommentText(e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(post.id);
                        }
                      }}
                    />
                    <Button 
                      size="sm"
                      className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!commentText.trim()}
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-[#1a2332] border-[#374151]">
            <CardContent className="p-8 text-center">
              <p className="text-[#9ca3af]">Nenhum post ainda</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Novo Post */}
      {showPostDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1a2332] border-[#374151] w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-bold text-white">Novo Post</h2>
              <button onClick={() => setShowPostDialog(false)} className="text-[#9ca3af] hover:text-white">
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Image */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Foto</label>
                <label className="w-full h-40 rounded-lg border-2 border-dashed border-[#374151] flex items-center justify-center cursor-pointer hover:border-[#fbbf24] transition-colors bg-[#111827]">
                  {postData.image_url ? (
                    <img src={postData.image_url} alt="preview" className="w-full h-full object-cover rounded" />
                  ) : (
                    <Upload className="text-[#9ca3af]" size={32} />
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Descrição (opcional)</label>
                <Textarea 
                  placeholder="O que você está compartilhando?"
                  className="bg-[#111827] border-[#374151]"
                  value={postData.caption}
                  onChange={(e) => setPostData({ ...postData, caption: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  className="border-[#374151] text-white"
                  onClick={() => setShowPostDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-[#f0c41b] text-black hover:bg-[#d4aa00]"
                  onClick={handleCreatePost}
                  disabled={!postData.image_url && !postData.caption}
                >
                  Publicar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}