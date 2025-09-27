import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  MessageSquare, 
  GitBranch, 
  UserPlus, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Mail,
  Settings,
  Eye,
  Edit3,
  Crown,
  Shield,
  PenTool,
  X,
  Send,
  FileText,
  Calendar
} from 'lucide-react';
import { ProjectMember, Comment, Assignment, Version, User } from '@/types/collaboration';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CollaborationPanelProps {
  projectMembers: ProjectMember[];
  comments: Comment[];
  assignments: Assignment[];
  versions: Version[];
  currentUser: User;
  onClose: () => void;
  onInviteUser: () => void;
  onAddComment: (content: string, position?: { start: number; end: number }) => void;
  onCreateAssignment: (assignment: Partial<Assignment>) => void;
}

export const CollaborationPanel = ({
  projectMembers,
  comments,
  assignments,
  versions,
  currentUser,
  onClose,
  onInviteUser,
  onAddComment,
  onCreateAssignment
}: CollaborationPanelProps) => {
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('team');

  const getRoleIcon = (role: ProjectMember['role']) => {
    switch (role) {
      case 'owner': return Crown;
      case 'admin': return Shield;
      case 'writer': return PenTool;
      case 'editor': return Edit3;
      case 'agent': return FileText;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getRoleColor = (role: ProjectMember['role']): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'destructive';
      case 'writer': return 'default';
      case 'editor': return 'secondary';
      case 'agent': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: Assignment['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'review': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const TeamTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Team Members ({projectMembers.length})</h3>
        <Button size="sm" onClick={onInviteUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </div>

      <ScrollArea className="h-80">
        <div className="space-y-3">
          {projectMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role);
            return (
              <Card key={member.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {member.user.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{member.user.name}</div>
                        <div className="text-sm text-muted-foreground">{member.user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleColor(member.role)} className="text-xs">
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                      {member.userId === currentUser.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                  </div>
                  
                  {!member.user.isOnline && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Last seen {formatTimeAgo(member.user.lastSeen)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const CommentsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Comments ({comments.length})</h3>
        <Badge variant="outline">{comments.filter(c => !c.resolved).length} unresolved</Badge>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
        />
        <Button 
          size="sm" 
          onClick={() => {
            if (newComment.trim()) {
              onAddComment(newComment);
              setNewComment('');
            }
          }}
          disabled={!newComment.trim()}
        >
          <Send className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className={comment.resolved ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {comment.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                      {comment.resolved && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {comment.thread.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {comment.thread.length} replies
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const AssignmentsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Assignments ({assignments.length})</h3>
        <Button size="sm" onClick={() => {}}>
          <FileText className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <ScrollArea className="h-80">
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{assignment.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {assignment.description}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(assignment.status)} className="text-xs">
                    {assignment.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={assignment.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {assignment.assignee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignment.assignee.name}</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const VersionsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Version History ({versions.length})</h3>
        <Badge variant="outline">Latest: v{versions.length}</Badge>
      </div>

      <ScrollArea className="h-80">
        <div className="space-y-3">
          {versions.map((version, index) => (
            <Card key={version.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">v{versions.length - index}</span>
                      <Badge variant="outline" className="text-xs">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {version.changeType}
                      </Badge>
                    </div>
                    <p className="text-sm">{version.summary}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={version.author.avatar} />
                          <AvatarFallback className="text-xs">
                            {version.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{version.author.name}</span>
                      </div>
                      <span>{formatTimeAgo(version.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="w-80 bg-background border-l border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Collaboration</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team" className="text-xs">Team</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tasks</TabsTrigger>
            <TabsTrigger value="versions" className="text-xs">History</TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="team" className="mt-0">
              <TeamTab />
            </TabsContent>
            
            <TabsContent value="comments" className="mt-0">
              <CommentsTab />
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-0">
              <AssignmentsTab />
            </TabsContent>
            
            <TabsContent value="versions" className="mt-0">
              <VersionsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Online collaborators indicator */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Currently Online</div>
        <div className="flex -space-x-2">
          {projectMembers
            .filter(member => member.user.isOnline)
            .slice(0, 5)
            .map((member) => (
              <Avatar key={member.userId} className="h-6 w-6 border border-background">
                <AvatarImage src={member.user.avatar} />
                <AvatarFallback className="text-xs">
                  {member.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          {projectMembers.filter(m => m.user.isOnline).length > 5 && (
            <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center text-xs">
              +{projectMembers.filter(m => m.user.isOnline).length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};