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
      setNotes(notesData || []);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notes & Remarks</h1>
        <p className="text-gray-600 mt-2">View all notes and remarks from your teachers and administration.</p>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-6">
          {notes.map((note, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      {getIcon(note.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={getBadgeColor(note.type)}
                      >
                        {note.type === 'attendance' ? 'Attendance' : note.type === 'fee' ? 'Fee' : 'General'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(note.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 leading-relaxed">{note.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notes Available</h3>
            <p className="text-gray-500">There are no notes or remarks for your account yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}