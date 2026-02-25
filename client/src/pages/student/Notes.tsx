import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, CreditCard, Clock } from 'lucide-react';
import { studentApi } from '@/lib/student-api';

interface Note {
  type: string;
  title: string;
  content: string;
  created_at: string;
}

export default function StudentNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const notesData = await studentApi.getNotes();
      setNotes((notesData as Note[]) || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'fee':
        return <CreditCard className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'border-blue-200 text-blue-700 bg-blue-50';
      case 'fee':
        return 'border-green-200 text-green-700 bg-green-50';
      default:
        return 'border-gray-200 text-gray-700 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-1 sm:px-4 lg:px-8 py-4 sm:py-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-heading">Notes & Remarks</h1>
        <p className="text-muted-foreground text-sm sm:text-base">View all notes and remarks from your teachers and administration.</p>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note, index) => (
            <Card key={index} className="shadow-sm border-muted/50 transition-all hover:shadow-md overflow-hidden hover:border-primary/30 group">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-stretch">
                  <div className={`w-1.5 sm:w-2 ${getBadgeColor(note.type).split(' ')[2]}`}></div>
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="flex-shrink-0 hidden sm:block">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-muted/50 transition-transform group-hover:scale-110">
                          {getIcon(note.type)}
                        </div>
                      </div>

                      <div className="flex-1 w-full min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-3">
                            <div className="sm:hidden bg-white p-2 rounded-lg shadow-sm border border-muted/50">
                              {getIcon(note.type)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 truncate font-heading group-hover:text-primary transition-colors">{note.title}</h3>
                          </div>
                          <Badge
                            variant="outline"
                            className={`w-fit shadow-none text-[10px] sm:text-xs font-bold px-3 py-0.5 rounded-full border ${getBadgeColor(note.type)}`}
                          >
                            {note.type === 'attendance' ? 'ATTENDANCE' : note.type === 'fee' ? 'FEE' : 'GENERAL'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-[10px] sm:text-sm text-muted-foreground font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(note.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="bg-muted/10 p-4 rounded-xl border border-muted/50">
                          <p className="text-gray-800 text-sm sm:text-base leading-relaxed">{note.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-lg border-muted/50 overflow-hidden">
          <CardContent className="text-center py-20 px-6">
            <div className="bg-muted/30 p-8 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center border-2 border-white shadow-inner">
              <FileText className="h-14 w-14 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 font-heading">No Notes Available</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">There are no notes or remarks for your account yet. Check back later for updates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}