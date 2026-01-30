import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, Trash2, Edit, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function InstructorProfile() {
  const [instructor, setInstructor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [newPost, setNewPost] = useState({ image_url: '', caption: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const instructors = await base44.entities.Instructor.filter({ user_email: user.email });
      
      if (instructors.length > 0) {
        setInstructor(instructors[0]);
        
        const postsData = await base44.entities.InstructorPost.filter({ instructor_id: instructors[0].id });
        setPosts(postsData);
        
        const commentsData = await base44.entities.InstructorComment.filter({ instructor_id: instructors[0].id });
        setComments(commentsData);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewPost(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.image_url) return;

    try {
      await base44.entities.InstructorPost.create({
        instructor_id: instructor.id,
        instructor_name: instructor.full_name,
        ...newPost
      });
      
      setNewPost({ image_url: '', caption: '' });
      setShowPostDialog(false);
      loadData();
    } catch (error) {
      alert('Erro ao criar post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Deseja excluir esta foto?')) return;
    
    try {
      await base44.entities.InstructorPost.delete(postId);
      loadData();
    } catch (error) {
      alert('Erro ao excluir post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Deseja excluir este comentário?')) return;
    
    try {
      await base44.entities.InstructorComment.delete(commentId);
      loadData();
    } catch (error) {
      alert('Erro ao excluir comentário');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <p className="text-white">Carregando...</p>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Card className="bg-[#1a2332] border-[#374151]">
          <CardContent className="p-6">
            <p className="text-white">Você não está cadastrado como instrutor</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24] hover:text-white mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>

        {/* Cover Photo */}
        {instructor.cover_photo && (
          <div className="h-64 rounded-t-lg overflow-hidden">
            <img src={instructor.cover_photo} alt="Capa" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Profile Info */}
        <Card className="bg-[#1a2332] border-[#374151] -mt-16 relative z-10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {instructor.photo && (
                <img 
                  src={instructor.photo} 
                  alt={instructor.full_name}
                  className="w-32 h-32 rounded-full border-4 border-[#1a2332] object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{instructor.full_name}</h1>
                <p className="text-[#9ca3af] mt-1">{instructor.bio}</p>
                <div className="flex gap-2 mt-3">
                  {instructor.teaches_car && <span className="px-3 py-1 bg-[#0969da] rounded-full text-xs">Carro</span>}
                  {instructor.teaches_moto && <span className="px-3 py-1 bg-[#f0c41b] text-white rounded-full text-xs">Moto</span>}
                  {instructor.teaches_bus && <span className="px-3 py-1 bg-[#0969da] rounded-full text-xs">Ônibus</span>}
                  {instructor.teaches_truck && <span className="px-3 py-1 bg-[#0969da] rounded-full text-xs">Caminhão</span>}
                  {instructor.teaches_trailer && <span className="px-3 py-1 bg-[#0969da] rounded-full text-xs">Carreta</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Minhas Fotos</h2>
            <Button
              onClick={() => setShowPostDialog(true)}
              className="bg-[#f0c41b] text-white hover:bg-[#d4aa00]"
            >
              <ImageIcon className="mr-2" size={18} />
              Nova Foto
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {posts.map((post) => (
              <div key={post.id} className="relative group aspect-square">
                <img 
                  src={post.image_url} 
                  alt={post.caption}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                {post.caption && (
                  <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/50 p-1 rounded">
                    {post.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Comentários ({comments.length})</h2>
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="bg-[#1a2332] border-[#374151]">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{comment.student_name}</p>
                      {comment.rating > 0 && (
                        <div className="flex gap-1 my-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < comment.rating ? 'text-[#f0c41b]' : 'text-gray-600'}>
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[#9ca3af] mt-1">{comment.comment}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* New Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-[#1a2332] border-[#374151]">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="post-image-upload"
              />
              <label htmlFor="post-image-upload">
                <Button type="button" variant="outline" className="w-full cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2" size={18} />
                    {uploadingImage ? 'Enviando...' : 'Escolher Imagem'}
                  </span>
                </Button>
              </label>
              {newPost.image_url && (
                <img src={newPost.image_url} alt="Preview" className="mt-3 w-full aspect-square object-cover rounded-lg" />
              )}
            </div>
            <Textarea
              value={newPost.caption}
              onChange={(e) => setNewPost({...newPost, caption: e.target.value})}
              placeholder="Escreva uma legenda..."
              className="bg-[#0d1117] border-[#374151] text-white"
            />
            <Button
              onClick={handleCreatePost}
              className="w-full bg-[#f0c41b] text-white hover:bg-[#d4aa00]"
              disabled={!newPost.image_url}
            >
              Publicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}