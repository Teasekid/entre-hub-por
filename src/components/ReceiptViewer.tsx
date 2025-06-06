
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface ReceiptViewerProps {
  receiptUrl: string | null;
  studentName: string;
  onClose: () => void;
}

const ReceiptViewer = ({ receiptUrl, studentName, onClose }: ReceiptViewerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!receiptUrl) return;

    try {
      const { data } = await supabase.storage
        .from('esp-receipts')
        .download(receiptUrl);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${studentName.replace(/\s+/g, '_')}`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Complete",
          description: "Receipt downloaded successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const getReceiptUrl = async () => {
    if (!receiptUrl) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase.storage
        .from('esp-receipts')
        .getPublicUrl(receiptUrl);

      setImageUrl(data.publicUrl);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load receipt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load receipt URL when component mounts
  useState(() => {
    getReceiptUrl();
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>ESP Receipt - {studentName}</DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="border-amber-700 text-amber-700"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex justify-center items-center min-h-[400px] bg-gray-50 rounded-lg">
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mx-auto mb-2"></div>
              <p>Loading receipt...</p>
            </div>
          ) : !receiptUrl ? (
            <div className="text-center text-gray-500">
              <p>No receipt was uploaded for this application.</p>
            </div>
          ) : (
            <img
              src={imageUrl || ''}
              alt={`Receipt for ${studentName}`}
              className="max-w-full max-h-[500px] object-contain rounded"
              onError={() => {
                toast({
                  title: "Error",
                  description: "Failed to load receipt image",
                  variant: "destructive",
                });
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptViewer;
