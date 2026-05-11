import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  type Connection,
  Panel,
  ReactFlowProvider,
  type Node,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  ArrowLeft, 
  Save, 
  MessageSquare, 
  HelpCircle, 
  List, 
  FileText,
  Play,
  Trash2,
  Edit2,
  Loader2
} from 'lucide-react';
import api from '../api';
import CustomNode from '../components/builder/CustomNode';
import NodeEditor from '../components/builder/NodeEditor';

const nodeTypes = {
  custom: CustomNode,
};

const BotBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bot, setBot] = useState<any>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setEditTempName] = useState('');

  useEffect(() => {
    fetchBotData();
  }, [id]);

  const fetchBotData = async () => {
    try {
      const response = await api.get(`/manage/${id}/`);
      const botData = response.data;
      setBot(botData);
      setEditTempName(botData.name);

      if (botData.nodes && botData.nodes.length > 0) {
        const transformedNodes: Node[] = botData.nodes.map((node: any) => ({
          id: node.settings.frontend_id || node.id.toString(),
          type: 'custom',
          position: node.settings.position || { x: 400, y: 50 },
          data: { 
            ...node, 
            onDelete: handleDeleteNode 
          },
        }));

        const transformedEdges: Edge[] = [];
        botData.nodes.forEach((node: any) => {
          const sourceId = node.settings.frontend_id || node.id.toString();
          if (node.step_type === 'button_choice') {
            const branching = node.settings.branching || {};
            Object.entries(branching).forEach(([btn, targetId]: [string, any]) => {
              transformedEdges.push({
                id: `e-${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId.toString(),
                sourceHandle: `handle-${btn}`,
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 },
              });
            });
          } else if (node.settings.next_node) {
            transformedEdges.push({
              id: `e-${sourceId}-${node.settings.next_node}`,
              source: sourceId,
              target: node.settings.next_node.toString(),
              animated: true,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            });
          }
        });

        setNodes(transformedNodes);
        setEdges(transformedEdges);
      }
    } catch (error) {
      console.error('Failed to fetch bot data:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const isButtonHandle = params.sourceHandle?.startsWith('handle-');
      const edgeStyle = isButtonHandle 
        ? { stroke: '#a855f7', strokeWidth: 2 } 
        : { stroke: '#94a3b8', strokeWidth: 2 };
      
      setEdges((eds) => addEdge({ 
        ...params, 
        animated: true, 
        style: edgeStyle 
      }, eds));
    },
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { 
        step_type: type, 
        content: type === 'message' ? 'Привет! Чем я могу помочь?' : 
                 type === 'question' ? 'Как вас зовут?' :
                 type === 'button_choice' ? 'Выберите подходящий вариант:' : 'Оставьте контакты', 
        settings: {
          buttons: type === 'button_choice' ? ['Консультация', 'Цены'] : [],
          placeholder: type === 'question' ? 'Введите текст...' : '',
          data_key: `field_${Date.now()}`
        },
        onDelete: handleDeleteNode
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
  };

  const handleSaveNode = (nodeId: string, updatedData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...updatedData } };
        }
        return node;
      })
    );
    setSelectedNode(null);
  };

  const saveFlow = async () => {
    if (nodes.length === 0) return;
    setIsSaving(true);
    try {
      // Update bot name if changed
      if (tempName !== bot.name) {
        await api.patch(`/manage/${id}/`, { name: tempName });
      }

      const targetNodes = new Set(edges.map(e => e.target));
      
      const payload = nodes.map(node => {
        const outgoingEdges = edges.filter(e => e.source === node.id);
        const settings = { ...(node.data?.settings as any) || {} };
        
        settings.frontend_id = node.id;
        settings.position = node.position;
        settings.is_first = !targetNodes.has(node.id);

        if (node.data?.step_type === 'button_choice') {
          settings.branching = {};
          outgoingEdges.forEach(edge => {
            const btnName = edge.sourceHandle?.replace('handle-', '');
            if (btnName) {
              settings.branching[btnName] = edge.target;
            }
          });
        } else {
          const edge = outgoingEdges[0];
          if (edge) {
            settings.next_node = edge.target;
          } else {
            delete settings.next_node;
          }
        }

        return {
          step_type: node.data?.step_type,
          content: node.data?.content,
          settings: settings
        };
      });

      await api.post(`/manage/${id}/save-nodes/`, payload);
      alert('Сценарий успешно опубликован!');
      fetchBotData(); 
    } catch (error) {
      console.error('Failed to save flow:', error);
      alert('Ошибка при сохранении сценария');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBot = async () => {
    if (!window.confirm('Удалить этого бота навсегда?')) return;
    try {
      await api.delete(`/manage/${id}/`);
      navigate('/dashboard');
    } catch (error) {
      alert('Ошибка при удалении');
    }
  };

  const firstNode = nodes.find(n => {
    const targetNodes = new Set(edges.map(e => e.target));
    return !targetNodes.has(n.id);
  }) || nodes[0];

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
      {/* Top Bar */}
      <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400">
            <ArrowLeft size={24} />
          </Link>
          <div className="h-10 w-[1px] bg-slate-100" />
          
          {editingName ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                className="px-4 py-2 bg-slate-50 border-2 border-indigo-500 rounded-xl font-black text-xl outline-none"
                value={tempName}
                onChange={(e) => setEditTempName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setEditingName(true)}>
              <h1 className="text-2xl font-black text-slate-900">{tempName || 'Загрузка...'}</h1>
              <Edit2 size={18} className="text-slate-300 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={deleteBot}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={18} />
            Удалить
          </button>
          <div className="h-8 w-[1px] bg-slate-100" />
          <button 
            onClick={saveFlow}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-95 ${isSaving ? 'opacity-70' : ''}`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Публикация...' : 'Опубликовать'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Navigation & Quick Access */}
        <div className="w-80 bg-white border-r border-slate-100 flex flex-col z-20 shadow-xl shadow-slate-200/20">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Quick Greeting Edit */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Первое сообщение</label>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><MessageSquare size={14}/></div>
              </div>
              {firstNode ? (
                <textarea 
                  className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl text-sm font-medium text-slate-700 leading-relaxed min-h-[120px] resize-none transition-all outline-none"
                  value={firstNode.data.content}
                  onChange={(e) => handleSaveNode(firstNode.id, { content: e.target.value })}
                  placeholder="Приветственное сообщение..."
                />
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-400 text-center italic">
                  Добавьте блоки, чтобы начать
                </div>
              )}
            </section>

            <div className="h-[1px] bg-slate-50" />

            {/* Blocks Panel */}
            <section>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block">Добавить блоки</label>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => addNode('message')} className="flex items-center gap-4 p-4 bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-[1.25rem] transition-all group shadow-sm">
                  <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">Сообщение</p>
                    <p className="text-[10px] text-slate-400 mt-1">Просто текст</p>
                  </div>
                </button>

                <button onClick={() => addNode('question')} className="flex items-center gap-4 p-4 bg-white hover:bg-amber-50 border border-slate-100 hover:border-amber-200 rounded-[1.25rem] transition-all group shadow-sm">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                    <HelpCircle size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">Вопрос</p>
                    <p className="text-[10px] text-slate-400 mt-1">Ждет текст</p>
                  </div>
                </button>

                <button onClick={() => addNode('button_choice')} className="flex items-center gap-4 p-4 bg-white hover:bg-purple-50 border border-slate-100 hover:border-purple-200 rounded-[1.25rem] transition-all group shadow-sm">
                  <div className="p-2.5 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                    <List size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">Кнопки</p>
                    <p className="text-[10px] text-slate-400 mt-1">Выбор варианта</p>
                  </div>
                </button>

                <button onClick={() => addNode('form')} className="flex items-center gap-4 p-4 bg-white hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-[1.25rem] transition-all group shadow-sm">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">Контакты</p>
                    <p className="text-[10px] text-slate-400 mt-1">Форма сбора</p>
                  </div>
                </button>
              </div>
            </section>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
             <div className="flex items-center gap-3 text-slate-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Автосохранение выключено</span>
             </div>
          </div>
        </div>

        <ReactFlowProvider>
          <div className="flex-1 h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <Background color="#cbd5e1" gap={30} size={1.5} />
              <Controls className="!bg-white !shadow-2xl !border-none !rounded-2xl overflow-hidden !m-6" />
            </ReactFlow>
          </div>
          
          {selectedNode && (
            <NodeEditor 
              node={selectedNode} 
              onSave={handleSaveNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default BotBuilder;
