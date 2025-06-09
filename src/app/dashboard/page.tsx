"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Room {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);
      await fetchRooms();
    } catch (err) {
      console.error("Error checking user:", err);
      router.push("/");
    }
  };

  const fetchRooms = async () => {
    try {
      const { data: rooms, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (rooms) {
        setRooms(rooms);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    try {
      setError(null);
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .insert({
          title: `Brainstorming Session - ${new Date().toLocaleDateString()}`,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;
      if (room) {
        router.push(`/room/${room.id}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setError("Failed to create room. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Rooms</h1>
            {user && (
              <p className="text-gray-600 mt-1">Welcome, {user.email}</p>
            )}
          </div>
          <div className="space-x-4">
            <button
              onClick={createRoom}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create New Room
            </button>
            <button
              onClick={handleSignOut}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading rooms...</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No rooms yet</p>
                <button
                  onClick={createRoom}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Your First Room
                </button>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => router.push(`/room/${room.id}`)}
                >
                  <h3 className="font-semibold text-lg mb-2">{room.title}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(room.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-blue-500 text-sm font-medium">
                      Click to join →
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}