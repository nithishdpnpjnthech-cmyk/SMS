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
      const profile = await studentApi.getProfile();
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Uniform Status</h1>
        <p className="text-gray-600 mt-2">Check your uniform issuance status and details.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shirt className="h-5 w-5" />
            Uniform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-6">
              {uniformData?.issued ? (
                <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              ) : (
                <div className="bg-red-100 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {uniformData?.issued ? 'Uniform Issued' : 'Uniform Not Issued'}
            </h3>
            
            {uniformData?.issued ? (
              <div className="space-y-3">
                {uniformData.issueDate && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Issued on: {new Date(uniformData.issueDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Uniform Collected
                </Badge>
                <p className="text-gray-600 mt-4">
                  Your uniform has been issued and collected. If you have any issues, please contact the administration.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  Pending Collection
                </Badge>
                <p className="text-gray-600 mt-4">
                  Please contact the administration office for uniform collection details and availability.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}