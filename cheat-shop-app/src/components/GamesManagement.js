'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';

export default function GamesManagement({ 
  games = [], 
  newGame, 
  setNewGame, 
  handleCreateGame, 
  handleEdit, 
  handleEditSave, 
  handleDelete, 
  handleDragEnd 
}) {
  const [editingGame, setEditingGame] = useState(null);

  const handleEditClick = (game) => {
    setEditingGame({ ...game });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await handleEditSave(editingGame);
    setEditingGame(null);
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
  };

  return (
    <div className="space-y-6">
      {/* Create Game Form */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Создать новую игру</h3>
        <form onSubmit={handleCreateGame} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Название игры *
              </label>
              <input
                type="text"
                value={newGame.name}
                onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Описание
              </label>
              <input
                type="text"
                value={newGame.description}
                onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#2E2F2F] rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Создать игру
            </button>
          </div>
        </form>
      </div>

      {/* Games List */}
      <div className="bg-[#171717] border border-[#2E2F2F] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#2E2F2F]">
          <h3 className="text-lg font-semibold text-white">Список игр</h3>
        </div>
        <div className="p-6">
          {games.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Игры не найдены</p>
          ) : (
            <div className="space-y-2">
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-4 p-4 bg-[#262626] rounded-xl hover:bg-[#2E2F2F] transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  
                  {editingGame?.id === game.id ? (
                    <form onSubmit={handleSaveEdit} className="flex-1 flex items-center space-x-4">
                      <input
                        type="text"
                        value={editingGame.name}
                        onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                      <input
                        type="text"
                        value={editingGame.description}
                        onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="file"
                        onChange={(e) => setEditingGame({ ...editingGame, imageFile: e.target.files[0] })}
                        className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#404040] rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="p-2 text-green-400 hover:bg-green-400 hover:text-white rounded-lg transition-colors"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-400 hover:bg-gray-600 hover:text-white rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{game.name}</h4>
                        {game.description && (
                          <p className="text-gray-400 text-sm">{game.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(game)}
                          className="p-2 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete('games', game.id)}
                          className="p-2 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}