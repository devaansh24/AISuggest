"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Copy, Check, Users, Calendar, ExternalLink, LogOut } from "lucide-react";

interface Room {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

interface User {
  id: string;
  email: string;
}

interface Participant {
  session_id: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

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
    if (!user) return;
    
    try {
      // Fetch rooms created by the user
      const { data: createdRooms, error: createdError } = await supabase
        .from("sessions")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Fetch rooms where user has participated
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("session_id")
        .eq("user_id", user.id) as { data: Participant[] | null, error: any };
      
      // Combine and deduplicate rooms
      const allRooms = new Map<string, Room>();
      
      // Add created rooms
      if (createdRooms) {
        createdRooms.forEach(room => allRooms.set(room.id, room));
      }

      // Add participated rooms
      if (participants && participants.length > 0) {
        const sessionIds = participants.map(p => p.session_id);
        const { data: participatedSessions } = await supabase
          .from("sessions")
          .select("*")
          .in("id", sessionIds);
        
        if (participatedSessions) {
          participatedSessions.forEach(room => allRooms.set(room.id, room));
        }
      }

      if (createdError) throw createdError;
      if (participantsError) throw participantsError;

      setRooms(Array.from(allRooms.values()));
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
      setIsCreatingRoom(true);
      setError(null);
      
      const roomTitle = `Brainstorming Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .insert({
          title: roomTitle,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;
      
      if (room) {
        // Automatically join the room as creator
        await supabase
          .from("participants")
          .insert({
            session_id: room.id,
            user_id: user.id,
            user_name: user.email?.split("@")[0] || "Anonymous",
            color: "#3b82f6",
            cursor_x: 0,
            cursor_y: 0,
            last_seen: new Date().toISOString(),
          });
          
        router.push(`/room/${room.id}`);
      }
    } catch (err) {
      console.error("Error creating room:", err);
      setError("Failed to create room. Please try again.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) {
      setError("Please enter a room ID");
      return;
    }

    if (!user) {
      router.push("/");
      return;
    }

    try {
      setError(null);
      
      // Check if room exists
      const { data: room, error: roomError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", joinRoomId.trim())
        .single();

      if (roomError || !room) {
        setError("Room not found. Please check the room ID.");
        return;
      }

      // Join the room as participant
      await supabase
        .from("participants")
        .upsert({
          session_id: room.id,
          user_id: user.id,
          user_name: user.email?.split("@")[0] || "Anonymous",
          color: getRandomColor(),
          cursor_x: 0,
          cursor_y: 0,
          last_seen: new Date().toISOString(),
        }, { onConflict: "session_id,user_id" });

      // Navigate to the room
      router.push(`/room/${room.id}`);
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Failed to join room. Please try again.");
    }
  };

  const getRandomColor = () => {
    const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const copyRoomId = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedId(roomId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy room ID:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const getUserDisplayName = (email: string) => {
    return email.split("@")[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Team Brainstorming</h1>
              {user && (
                <p className="text-gray-600 mt-1">
                  Welcome back, <span className="font-medium">{getUserDisplayName(user.email)}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
              >
                Join Room
              </button>
              <button
                onClick={createRoom}
                disabled={isCreatingRoom}
                className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm disabled:bg-blue-300"
              >
                {isCreatingRoom ? "Creating..." : "Create Room"}
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-500 text-white px-4 py-2.5 rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Rooms Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">My Collaboration Rooms</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-600">Loading rooms...</div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.length === 0 ? (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No rooms yet</h3>
                    <p className="text-gray-500 mb-8">Create your first room to start collaborating with your team</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={createRoom}
                        disabled={isCreatingRoom}
                        className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm disabled:bg-blue-300"
                      >
                        {isCreatingRoom ? "Creating..." : "Create Your First Room"}
                      </button>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                      >
                        Join Existing Room
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                          {room.title}
                        </h3>
                        <button
                          onClick={() => copyRoomId(room.id)}
                          className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                          title="Copy Room ID"
                        >
                          {copiedId === room.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-2">Room ID (Share to invite others):</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border flex-1 truncate">
                              {room.id}
                            </code>
                            <button
                              onClick={() => copyRoomId(room.id)}
                              className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                            >
                              {copiedId === room.id ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/room/${room.id}`)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Enter Room
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Join Room Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Join a Room</h2>
              <p className="text-gray-600 mb-6">
                Enter the room ID shared by your teammate to join their brainstorming session.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Room ID
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                    placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setJoinRoomId("");
                      setError(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={joinRoom}
                    className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}