import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { 
  Car, 
  Bike, 
  Bus,
  Truck,
  Phone,
  MessageCircle,
  Star,
  Play,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [activeTab, setActiveTab] = useState('sobre');
  const [newComment, setNewComment] = useState({ rating: 0, comment: '' });
  const [student, setStudent] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  // pós-cadastro: permite ver instrutores antes do pagamento
  const urlParams = new URLSearchParams(window.location.search);
  const postSignup = urlParams.get('postSignup') === 'true';
  const amountParam = urlParams.get('amount');

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ user_email: user.email });
      if (students.length > 0) setStudent(students[0]);

      const allInstructors = await base44.entities.Instructor.filter({ active: true });
      setInstructors(allInstructors);

      const allReviews = await base44.entities.InstructorReview.list();
      setReviews(allReviews);

      const allComments = await base44.entities.InstructorComment.list();
      setComments(allComments);

      const allPosts = await base44.entities.InstructorPost.list();
      setPosts(allPosts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getInstructorReviews = (instructorId) => {
    return reviews.filter(r => r.instructor_id === instructorId);
  };

  const getAverageRating = (instructorId) => {
    const instructorReviews = getInstructorReviews(instructorId);
    if (instructorReviews.length === 0) return 0;
    const sum = instructorReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / instructorReviews.length).toFixed(1);
  };

  const handleSubmitComment = async () => {
    if (!selectedInstructor || !student || !newComment.comment) return;
    
    try {
      await base44.entities.InstructorComment.create({
        instructor_id: selectedInstructor.id,
        student_id: student.id,
        student_name: student.full_name,
        rating: newComment.rating,
        comment: newComment.comment
      });
      
      setNewComment({ rating: 0, comment: '' });
      loadData();
    } catch (e) {
      console.log(e);
    }
  };

  const getInstructorPosts = (instructorId) => {
    return posts.filter(p => p.instructor_id === instructorId);
  };

  const getInstructorComments = (instructorId) => {
    return comments.filter(c => c.instructor_id === instructorId);
  };

  const getVehicleBadges = (instructor) => {
    const badges = [];
    if (instructor.teaches_car) badges.push({ icon: Car, label: 'Carro', color: 'text-[#3b82f6]' });
    if (instructor.teaches_moto) badges.push({ icon: Bike, label: 'Moto', color: 'text-[#fbbf24]' });
    if (instructor.teaches_bus) badges.push({ icon: Bus, label: 'Ônibus', color: 'text-green-400' });
    if (instructor.teaches_truck) badges.push({ icon: Truck, label: 'Caminhão', color: 'text-orange-400' });
    if (instructor.teaches_trailer) badges.push({ icon: Truck, label: 'Carreta', color: 'text-purple-400' });
    return badges;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#fbbf24]">Carregando...</div>
      </div>
    );
  }


  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-black h-9"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Nossos Instrutores</h1>
      </div>

      {postSignup && (
        <div className="p-3 rounded-lg border border-[#fbbf24]/50 bg-[#fbbf24]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs sm:text-sm text-white">Cadastro concluído! Explore os instrutores e depois finalize o pagamento.</span>
          <Button className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] w-full sm:w-auto h-9 text-sm whitespace-nowrap" onClick={() => navigate(createPageUrl('Payment') + '?amount=' + (amountParam || 0))}>Ir para pagamento</Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {instructors.map((instructor) => {
          const rating = getAverageRating(instructor.id);
          const reviewCount = getInstructorReviews(instructor.id).length;
          const badges = getVehicleBadges(instructor);

          return (
            <Card 
              key={instructor.id} 
              className="bg-[#1a2332] border-[#374151] hover:border-[#3b82f6] transition-all cursor-pointer"
              onClick={() => setSelectedInstructor(instructor)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1e40af]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {instructor.photo ? (
                      <img src={instructor.photo} alt={instructor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg sm:text-2xl font-bold text-[#fbbf24]">
                        {instructor.full_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base truncate text-white">{instructor.full_name}</h3>
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                      <Star className="text-[#fbbf24] fill-[#fbbf24]" size={12} />
                      <span className="text-white">{rating}</span>
                      <span className="text-[#9ca3af]">({reviewCount})</span>
                    </div>
                    <div className="flex gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                      {badges.map((badge, idx) => {
                        const Icon = badge.icon;
                        return (
                          <Badge key={idx} variant="outline" className="border-[#374151] text-[10px] sm:text-xs py-0 px-1.5">
                            <Icon size={10} className={badge.color + " mr-0.5"} />
                            {badge.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal do Instrutor */}
      <Dialog open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
        <DialogContent className="bg-[#1a2332] border-[#374151] text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedInstructor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#1e40af]/20 flex items-center justify-center overflow-hidden">
                    {selectedInstructor.photo ? (
                      <img src={selectedInstructor.photo} alt={selectedInstructor.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-[#fbbf24]">
                        {selectedInstructor.full_name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedInstructor.full_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="text-[#fbbf24] fill-[#fbbf24]" size={16} />
                      <span className="text-white">{getAverageRating(selectedInstructor.id)}</span>
                      <span className="text-[#9ca3af]">({getInstructorReviews(selectedInstructor.id).length} avaliações)</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="overflow-y-auto pr-2 flex-1">

                <div className="flex gap-2 mt-4">
                {selectedInstructor.phone && (
                  <a href={`tel:${selectedInstructor.phone}`}>
                    <Button variant="outline" className="border-[#374151]">
                      <Phone size={16} className="mr-2" />
                      Ligar
                    </Button>
                  </a>
                )}
                {selectedInstructor.whatsapp_link && (
                  <a href={selectedInstructor.whatsapp_link} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <MessageCircle size={16} className="mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="bg-[#111827] border border-[#374151]">
                  <TabsTrigger value="sobre" className="data-[state=active]:bg-[#1e40af]">Sobre</TabsTrigger>
                  <TabsTrigger value="videos" className="data-[state=active]:bg-[#1e40af]">Vídeos</TabsTrigger>
                  <TabsTrigger value="fotos" className="data-[state=active]:bg-[#1e40af]">Fotos</TabsTrigger>
                  <TabsTrigger value="avaliacoes" className="data-[state=active]:bg-[#1e40af]">Avaliações</TabsTrigger>
                </TabsList>

                <TabsContent value="sobre" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      {getVehicleBadges(selectedInstructor).map((badge, idx) => {
                        const Icon = badge.icon;
                        return (
                          <Badge key={idx} className="bg-[#111827] border border-[#374151] text-sm py-1 px-3">
                            <Icon size={16} className={badge.color + " mr-2"} />
                            {badge.label}
                          </Badge>
                        );
                      })}
                    </div>
                    {selectedInstructor.bio && (
                      <p className="text-[#9ca3af]">{selectedInstructor.bio}</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                  {selectedInstructor.videos?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedInstructor.videos.map((video, idx) => (
                        <div key={idx} className="relative aspect-video bg-[#111827] rounded-lg overflow-hidden">
                          <video 
                            src={video.url} 
                            controls 
                            className="w-full h-full object-cover"
                            poster={video.thumbnail}
                          />
                          {video.title && (
                            <p className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-xs">{video.title}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#9ca3af]">
                      <Play size={32} className="mx-auto mb-2" />
                      <p>Nenhum vídeo disponível</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fotos" className="mt-4">
                  {getInstructorPosts(selectedInstructor.id).length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {getInstructorPosts(selectedInstructor.id).map((post) => (
                        <div key={post.id} className="aspect-square bg-[#111827] rounded-lg overflow-hidden relative">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                          {post.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70">
                              <p className="text-xs text-white">{post.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#9ca3af]">
                      <ImageIcon size={32} className="mx-auto mb-2" />
                      <p>Nenhuma foto disponível</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="avaliacoes" className="mt-4 space-y-4">
                  {student && (
                    <div className="p-4 bg-[#111827] rounded-lg border border-[#374151]">
                      <h4 className="font-bold mb-3 text-white">Deixe seu comentário</h4>
                      <div className="mb-3">
                        <label className="text-sm text-[#9ca3af] mb-2 block">Avaliação (opcional)</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star}
                              onClick={() => setNewComment({...newComment, rating: star})}
                            >
                              <Star 
                                size={24} 
                                className={star <= newComment.rating ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-[#374151]'} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea 
                        className="bg-[#1a2332] border-[#374151] mb-3"
                        placeholder="Escreva seu comentário..."
                        value={newComment.comment}
                        onChange={(e) => setNewComment({...newComment, comment: e.target.value})}
                      />
                      <Button 
                        className="bg-[#f0c41b] text-black hover:bg-[#d4aa00] w-full sm:w-auto h-10"
                        onClick={handleSubmitComment}
                        disabled={!newComment.comment}
                      >
                        Enviar Comentário
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {getInstructorComments(selectedInstructor.id).map((comment) => (
                      <div key={comment.id} className="p-3 bg-[#111827] rounded-lg border border-[#374151]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{comment.student_name}</span>
                          {comment.rating > 0 && (
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  size={14} 
                                  className={star <= comment.rating ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-[#374151]'} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-[#9ca3af]">{comment.comment}</p>
                      </div>
                    ))}
                    {getInstructorComments(selectedInstructor.id).length === 0 && (
                      <div className="text-center py-4 text-[#9ca3af]">
                        <p>Nenhum comentário ainda</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              </div>
              </>
              )}
              </DialogContent>
              </Dialog>
    </div>
  );
}