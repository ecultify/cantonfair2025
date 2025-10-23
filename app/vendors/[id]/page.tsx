"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { dataService } from "@/lib/data";
import { ArrowLeft, Phone, Mail, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Vendor, Product, POC } from "@/lib/db/dexie";
import Link from "next/link";

export default function VendorDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pocs, setPocs] = useState<POC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && params.id) {
      loadVendorDetails();
    }
  }, [user, params.id]);

  const loadVendorDetails = async () => {
    try {
      const vendorData = await dataService.vendors.findById(params.id as string);
      setVendor(vendorData);

      if (vendorData) {
        const [productsData, pocsData] = await Promise.all([
          dataService.products.findByVendorId(vendorData.id),
          dataService.pocs.findByVendorId(vendorData.id),
        ]);
        setProducts(productsData);
        setPocs(pocsData);
      }
    } catch (error) {
      console.error("Error loading vendor:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Vendor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-slate-900 truncate">{vendor.companyName}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{vendor.companyName}</CardTitle>
                {vendor.brandName && (
                  <p className="text-slate-500 mt-1">{vendor.brandName}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {vendor.hall && <Badge>Hall {vendor.hall}</Badge>}
                {vendor.stall && <Badge variant="outline">Stall {vendor.stall}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                  {vendor.email}
                </a>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">
                  {vendor.phone}
                </a>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {vendor.website}
                </a>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-500 mt-1" />
                <p className="text-slate-700">{vendor.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({pocs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Country</p>
                  <p className="font-medium">{vendor.country || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phase</p>
                  <p className="font-medium">{vendor.phase || "Not specified"}</p>
                </div>
                {vendor.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {vendor.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            {products.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-slate-500">No products added yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {product.category && (
                          <p className="text-sm"><span className="text-slate-500">Category:</span> {product.category}</p>
                        )}
                        {product.unitPrice && (
                          <p className="text-sm">
                            <span className="text-slate-500">Price:</span> {product.currency} {product.unitPrice}
                          </p>
                        )}
                        {product.moq && (
                          <p className="text-sm"><span className="text-slate-500">MOQ:</span> {product.moq}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            {pocs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-slate-500">No contacts added yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pocs.map((poc) => (
                  <Card key={poc.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{poc.name}</CardTitle>
                      {poc.designation && (
                        <p className="text-sm text-slate-500">{poc.designation}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {poc.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <a href={`mailto:${poc.email}`} className="text-blue-600 hover:underline text-sm">
                            {poc.email}
                          </a>
                        </div>
                      )}
                      {poc.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <a href={`tel:${poc.phone}`} className="text-blue-600 hover:underline text-sm">
                            {poc.phone}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
