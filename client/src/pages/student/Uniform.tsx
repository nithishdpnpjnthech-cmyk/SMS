import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shirt, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { studentApi } from '@/lib/student-api';

interface UniformData {
  issued: boolean;
  issueDate?: string;
}

export default function StudentUniform() {
  const [uniformData, setUniformData] = useState<UniformData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUniformData();
  }, []);

  const loadUniformData = async () => {
    try {
      const profile = await studentApi.getProfile() as any;
      setUniformData(profile.uniform);
    } catch (error) {
      console.error('Failed to load uniform data:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-heading">Uniform Status</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Check your uniform issuance status and details.</p>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg border-muted/50 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-heading">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm">
              <Shirt className="h-5 w-5" />
            </div>
            Uniform Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8 relative">
              {uniformData?.issued ? (
                <div className="bg-green-100/50 p-8 rounded-full w-28 h-28 sm:w-32 sm:h-32 mx-auto flex items-center justify-center border-4 border-white shadow-xl">
                  <CheckCircle className="h-14 w-14 sm:h-16 sm:w-16 text-green-600 drop-shadow-sm" />
                </div>
              ) : (
                <div className="bg-orange-100/50 p-8 rounded-full w-28 h-28 sm:w-32 sm:h-32 mx-auto flex items-center justify-center border-4 border-white shadow-xl">
                  <XCircle className="h-14 w-14 sm:h-16 sm:w-16 text-orange-600 drop-shadow-sm" />
                </div>
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 font-heading">
              {uniformData?.issued ? 'Uniform Issued' : 'Uniform Not Issued'}
            </h3>

            {uniformData?.issued ? (
              <div className="space-y-6">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-1.5 font-bold shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  COLLECTED
                </Badge>

                <div className="space-y-4 pt-4">
                  {uniformData.issueDate && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-muted/20 rounded-xl border border-muted/50 text-gray-600 shadow-inner">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Issued on <span className="font-bold text-gray-900">{new Date(uniformData.issueDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </span>
                    </div>
                  )}
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-4">
                    Your academy uniform has been officially issued. If you need any assistance or have sizing concerns, please visit the administration office.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-4 py-1.5 font-bold shadow-sm">
                  PENDING COLLECTION
                </Badge>
                <div className="space-y-4 pt-4 px-4 text-center">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Your uniform set is currently <span className="font-bold text-orange-600">awaiting collection</span>. Please visit the reception desk during operational hours to collect your kit.
                  </p>
                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 text-orange-700 text-xs font-medium italic">
                    Note: Please carry your active Student ID card for verification.
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}