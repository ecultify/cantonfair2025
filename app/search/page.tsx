"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { dataService } from "@/lib/data";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Vendor } from "@/lib/db/dexie";
import Link from "next/link";

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [results, setResults] = useState<Vendor[]>([]);

  useEffect(() => {
    if (user) {
      loadVendors();
    }
  }, [user]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = vendors.filter((v) =>
        v.companyName.toLowerCase().includes(query.toLowerCase()) ||
        v.brandName?.toLowerCase().includes(query.toLowerCase()) ||
        v.phone?.includes(query) ||
        v.email?.toLowerCase().includes(query.toLowerCase()) ||
        v.hall?.toLowerCase().includes(query.toLowerCase()) ||
        v.stall?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, vendors]);

  const loadVendors = async () => {
    if (!user) return;
    try {
      const data = await dataService.vendors.findAll(user.id);
      setVendors(data);
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <Input
              placeholder="Search vendors, halls, stalls..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {query.trim() === "" ? (
          <div className="text-center py-12 text-slate-500">
            <SearchIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p>Enter keywords to search</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <SearchIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 mb-4">
              Found {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {vendor.companyName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{vendor.companyName}</h3>
                        {vendor.brandName && (
                          <p className="text-sm text-slate-500 truncate">{vendor.brandName}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {vendor.hall && (
                            <Badge variant="secondary" className="text-xs">
                              Hall {vendor.hall}
                            </Badge>
                          )}
                          {vendor.stall && (
                            <Badge variant="outline" className="text-xs">
                              Stall {vendor.stall}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
