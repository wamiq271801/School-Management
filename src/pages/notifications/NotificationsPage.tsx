import { useState, useEffect } from "react";
import { Bell, Plus, Send, Paperclip, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToNotifications,
  createNotification,
  markNotificationAsRead,
  type Notification,
} from "@/lib/firestoreNotifications";
import { uploadFileToDrive } from "@/lib/googleDrive";

const NotificationsPage = () => {
  const { toast } = useToast();
  const userId = "admin"; // In real app, get from auth
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement" as Notification["type"],
    recipientType: "all" as Notification["recipientType"],
    priority: "medium" as Notification["priority"],
  });

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      setFilteredNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    let filtered = notifications;
    
    if (filterType !== "all") {
      filtered = filtered.filter(n => n.type === filterType);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredNotifications(filtered);
  }, [searchTerm, filterType, notifications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      
      // Upload attachment if provided
      if (attachment) {
        const apiKey = localStorage.getItem("drive_api_key");
        const rootFolderId = localStorage.getItem("drive_root_folder_id");
        
        if (apiKey && rootFolderId) {
          const result = await uploadFileToDrive(attachment, rootFolderId);
          attachmentUrl = result.webViewLink;
          attachmentName = result.fileName;
        } else {
          toast({
            title: "Warning",
            description: "Google Drive not configured. Attachment not uploaded.",
            variant: "destructive",
          });
        }
      }
      
      await createNotification({
        ...formData,
        attachmentUrl,
        attachmentName,
        createdBy: userId,
      });
      
      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId, userId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "announcement",
      recipientType: "all",
      priority: "medium",
    });
    setAttachment(null);
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "system": return "bg-muted text-muted-foreground";
      case "announcement": return "bg-primary/20 text-primary";
      case "private": return "bg-accent/20 text-accent";
      case "fee": return "bg-destructive/20 text-destructive";
      case "exam": return "bg-success/20 text-success";
      case "attendance": return "bg-warning/20 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high": return <Badge className="bg-destructive text-destructive-foreground">High</Badge>;
      case "medium": return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
      case "low": return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Manage alerts and announcements</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-lg shadow-level-2">
              <Plus className="w-4 h-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-xl">
            <DialogHeader>
              <DialogTitle>Send New Notification</DialogTitle>
              <DialogDescription>
                Create and send a notification to students and teachers
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Notification title"
                  required
                  className="rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Notification message"
                  rows={4}
                  required
                  className="rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: Notification["type"]) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipients</Label>
                  <Select value={formData.recipientType || "all"} onValueChange={(value: Notification["recipientType"]) => setFormData({ ...formData, recipientType: value })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: Notification["priority"]) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="attachment">Attachment (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="attachment"
                    type="file"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    className="rounded-lg"
                  />
                  {attachment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachment(null)}
                      className="rounded-lg"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" className="gap-2 rounded-lg">
                  <Send className="w-4 h-4" />
                  Send Notification
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4 rounded-xl shadow-level-2 border-0">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications..."
                className="pl-10 rounded-lg"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 rounded-lg">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 rounded-xl shadow-level-2 border-0 text-center">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No notifications found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your filters" 
                : "Send your first notification to get started"}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const isUnread = !notification.readBy.includes(userId);
            
            return (
              <Card
                key={notification.id}
                className={`p-5 rounded-xl shadow-level-2 border-0 transition-all cursor-pointer ${
                  isUnread ? "bg-primary/5 border-l-4 border-l-primary" : ""
                }`}
                onClick={() => isUnread && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${getTypeColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {notification.title}
                          {isUnread && (
                            <Badge className="ml-2 bg-primary text-primary-foreground">New</Badge>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          {getPriorityBadge(notification.priority)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {notification.message}
                    </p>
                    
                    {notification.attachmentUrl && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(notification.attachmentUrl, "_blank");
                          }}
                          className="gap-2 rounded-lg"
                        >
                          <Paperclip className="w-4 h-4" />
                          {notification.attachmentName || "View Attachment"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
