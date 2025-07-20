'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Music } from "lucide-react";
import { CreateBandModal } from './create-band-modal';
import { JoinBandModal } from './join-band-modal';

interface BandsListProps {
  bands: any[];
}

export function BandsList({ bands }: BandsListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Bands</h2>
        <div className="space-x-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Band
          </Button>
          <Button variant="outline" onClick={() => setShowJoinModal(true)}>
            Join Band
          </Button>
        </div>
      </div>

      {bands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bands yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first band or join an existing one to start practicing together
            </p>
            <div className="space-x-2">
              <Button onClick={() => setShowCreateModal(true)}>
                Create Band
              </Button>
              <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                Join Band
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bands.map((band) => (
            <Link key={band.id} href={`/bands/${band.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{band.name}</CardTitle>
                    <Badge variant={band.role === 'admin' ? 'default' : 'secondary'}>
                      {band.role}
                    </Badge>
                  </div>
                  <CardDescription>
                    Joined {new Date(band.joinedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {band._count?.members || 0} members
                    </div>
                    <div className="flex items-center">
                      <Music className="h-4 w-4 mr-1" />
                      {band._count?.songs || 0} songs
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateBandModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
      <JoinBandModal 
        open={showJoinModal} 
        onOpenChange={setShowJoinModal}
      />
    </>
  );
}