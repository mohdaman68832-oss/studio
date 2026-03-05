
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock, Circle, Loader2, MoreVertical, Plus, Image as ImageIcon, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, addDoc, serverTimestamp, setDoc, limit, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { ReportDialog } from "@/components/report-dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const chatId = params.id as string;

  const recipientId = chatId.split("_").find(id => id !== currentUser?.uid) || "";

  const recipientRef = useMemoFirebase(() => (db && recipientId && currentUser ? doc(db, "userProfiles", recipientId) : null), [db, recipientId, currentUser]);
  const { data: recipient, isLoading: isRecipientLoading } = useDoc(recipientRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !chatId || !currentUser) return null;
    return query(
      collection(db, "privateChats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, chatId, currentUser]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  const [newMessage, setNewMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (db && currentUser && chatId) {
      const chatRef = doc(db, "privateChats", chatId);
      updateDoc(chatRef, {
        [`unreadCounts.${currentUser.uid}`]: 0
      }).catch(err => console.warn("Failed to clear unread counts", err));
    }
  }, [db, currentUser, chatId, messages?.length]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await toBase64(file);
      setMediaUrl(base64);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    } catch (err) {
      toast({ variant: "destructive", title: "Process Failed", description: "Media processing error." });
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !mediaUrl) || !db || !currentUser || !chatId || !recipientId || isSending) return;
    
    setIsSending(true);
    const text = newMessage;
    const currentMediaUrl = mediaUrl;
    const currentMediaType = mediaType;

    setNewMessage("");
    setMediaUrl(null);
    setMediaType(null);

    const chatRef = doc(db, "privateChats", chatId);
    const messagesRef = collection(db, "privateChats", chatId, "messages");

    const messageData = {
      senderId: currentUser.uid,
      text: text,
      mediaUrl: currentMediaUrl || "",
      mediaType: currentMediaType || "",
      createdAt: serverTimestamp(),
    };

    // Update chat metadata
    setDoc(chatRef, {
      chatId: chatId,
      participants: chatId.split("_"),
      lastMessage: currentMediaUrl ? (currentMediaType === 'image' ? "📷 Photo" : "🎥 Video") : text,
      timestamp: serverTimestamp(),
      [`unreadCounts.${recipientId}`]: increment(1)
    }, { merge: true }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: chatRef.path,
        operation: 'write',
        requestResourceData: { lastMessage: text }
      }));
    });

    // Add message
    addDoc(messagesRef, messageData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: messagesRef.path,
        operation: 'create',
        requestResourceData: messageData
      }));
    }).finally(() => setIsSending(false));
  };

  if (isUserLoading || isRecipientLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex flex-col fixed inset-0 max-w-md mx-auto bg-background overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-[60] shrink-0">
        <Link 
          href={`/profile/${recipient?.username}`} 
          className="flex-1 min-w-0 flex items-center gap-3 group hover:opacity-80 transition-opacity"
        >
          <div className="relative shrink-0">
            <Avatar className={cn(
              "h-10 w-10 border-2 border-primary/10 group-hover:border-primary transition-all",
              recipient?.isOnline && "shadow-[0_15px_30px_rgba(255,69,0,0.5)] shadow-primary/50 border-primary"
            )}>
              <AvatarImage src={recipient?.profilePictureUrl} className="object-cover" />
              <AvatarFallback>{recipient?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            {recipient?.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">
              @{recipient?.username || "Innovator"}
            </h2>
            <div className="flex items-center gap-1">
               {recipient?.isOnline ? (
                 <span className="text-[8px] text-green-500 font-black uppercase flex items-center gap-1">
                   <Circle size={6} className="fill-current" /> Active Now
                 </span>
               ) : (
                 <span className="text-[8px] text-muted-foreground font-black uppercase">Offline</span>
               )}
            </div>
          </div>
        </Link>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 focus-visible:ring-0"><MoreVertical size={20} className="text-muted-foreground" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl p-1 border-2">
            <DropdownMenuItem asChild>
              <ReportDialog 
                targetId={chatId} 
                targetType="message" 
                trigger={<button className="w-full text-left px-3 py-2 text-xs font-black uppercase flex items-center gap-2 text-destructive">Report Chat</button>} 
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-primary/[0.02]"
      >
        <div className="bg-white/50 border border-border/30 p-4 rounded-[2rem] text-center mb-6 max-w-[80%] mx-auto">
           <Lock size={16} className="mx-auto text-primary mb-2 opacity-30" />
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Private Encryption Active</p>
           <p className="text-[8px] text-muted-foreground mt-1 font-medium">Only participants can access this communication channel.</p>
        </div>
        
        {messages?.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          const hasMedia = msg.mediaUrl && msg.mediaUrl !== "";
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex w-full max-w-[85%] flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 duration-300",
                isMe ? "ml-auto items-end" : "items-start"
              )}
            >
              <div 
                className={cn(
                  "rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm group relative overflow-hidden",
                  isMe 
                    ? "bg-primary text-white rounded-tr-none shadow-primary/20" 
                    : "bg-white text-foreground rounded-tl-none border border-border/50",
                  hasMedia ? "p-1 pb-2" : "px-4 py-3"
                )}
              >
                {hasMedia && (
                  <div className="mb-2 rounded-xl overflow-hidden bg-black/5">
                    {msg.mediaType === 'video' ? (
                      <video src={msg.mediaUrl} className="w-full max-h-60 object-contain" controls />
                    ) : (
                      <Image 
                        src={msg.mediaUrl} 
                        alt="Chat attachment" 
                        width={400} 
                        height={400} 
                        className="w-full max-h-60 object-contain" 
                        unoptimized
                      />
                    )}
                  </div>
                )}
                <div className={hasMedia ? "px-3" : ""}>{msg.text}</div>
                {!isMe && (
                  <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ReportDialog targetId={msg.id} targetType="message" />
                  </div>
                )}
              </div>
              {msg.createdAt && (
                <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                  {new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          );
        })}
        {(isMessagesLoading || isSending) && (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary/20" /></div>
        )}
      </div>

      <div className="shrink-0 p-4 bg-white border-t z-[70] pb-safe space-y-3">
        {mediaUrl && (
          <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-2xl animate-in slide-in-from-bottom-2">
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-black/5 shrink-0">
              {mediaType === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black"><Video className="text-white" size={20} /></div>
              ) : (
                <Image src={mediaUrl} alt="Preview" fill className="object-cover" unoptimized />
              )}
              <button 
                onClick={() => { setMediaUrl(null); setMediaType(null); }}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-primary">Attachment Ready</p>
              <p className="text-[9px] text-muted-foreground truncate">{mediaType === 'image' ? 'Image File' : 'Video File'}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileChange} 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-11 w-11 bg-muted/30 text-primary shrink-0 active:scale-95 transition-transform"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={24} />
          </Button>
          
          <div className="flex-1 flex items-center gap-2 bg-muted/30 rounded-[2rem] pl-4 pr-1 py-1 border border-primary/10">
            <Input 
              placeholder="Secure private message..." 
              className="border-none bg-transparent focus-visible:ring-0 shadow-none h-12 p-0 text-sm font-medium"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              onFocus={() => {
                setTimeout(scrollToBottom, 300);
              }}
            />
            <Button 
              size="icon" 
              className="rounded-full h-11 w-11 bg-primary text-white shrink-0 shadow-lg active:scale-95 transition-transform"
              onClick={handleSend}
              disabled={(!newMessage.trim() && !mediaUrl) || isSending}
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
