import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiPaperclip, FiArrowLeft, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl, getInitials, timeAgo, formatDate } from '../utils/helpers';
import './ChatPage.css';

const ChatPage = () => {
  const { userId: targetUserId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef();
  const typingTimer = useRef();
  const fileRef = useRef();

  // Load conversations list
  useEffect(() => {
    api.get('/chat/conversations')
      .then(({ data }) => setConversations(data.data || []))
      .catch(() => {});
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (partnerUserId) => {
    if (!partnerUserId) return;
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chat/${partnerUserId}`);
      setMessages(data.data || []);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoadingMsgs(false); }
  }, []);

  // Load target user if userId in URL
  useEffect(() => {
    if (!targetUserId) return;
    const loadPartner = async () => {
      try {
        // Try to find in conversations first, otherwise fetch user info
        const conv = conversations.find((c) => c.partner?._id === targetUserId);
        if (conv) {
          setActivePartner(conv.partner);
        } else {
          // Fetch basic user info by sending an API call
          const { data } = await api.get(`/chat/${targetUserId}`);
          if (data.data.length > 0) {
            const msg = data.data[0];
            const partner = msg.sender._id === user._id ? msg.receiver : msg.sender;
            setActivePartner(partner);
          } else {
            // No messages yet — set minimal partner
            setActivePartner({ _id: targetUserId, name: 'User' });
          }
          setMessages(data.data || []);
          return;
        }
        loadMessages(targetUserId);
      } catch { toast.error('Failed to open chat'); }
    };
    loadPartner();
  }, [targetUserId, conversations, loadMessages, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !activePartner) return;

    const onReceive = (msg) => {
      if (msg.sender._id === activePartner._id || msg.sender === activePartner._id) {
        setMessages((prev) => [...prev, msg]);
        socket.emit('mark_read', { senderId: activePartner._id });
      }
    };

    const onSent = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onTyping = ({ senderId }) => {
      if (senderId === activePartner._id) setPartnerTyping(true);
    };
    const onStopTyping = ({ senderId }) => {
      if (senderId === activePartner._id) setPartnerTyping(false);
    };

    socket.on('receive_message', onReceive);
    socket.on('message_sent', onSent);
    socket.on('partner_typing', onTyping);
    socket.on('partner_stop_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('message_sent', onSent);
      socket.off('partner_typing', onTyping);
      socket.off('partner_stop_typing', onStopTyping);
    };
  }, [socket, activePartner]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !activePartner) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { receiverId: activePartner._id });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      socket.emit('stop_typing', { receiverId: activePartner._id });
    }, 1200);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;
    setSending(true);

    if (socket?.connected) {
      socket.emit('send_message', { receiverId: activePartner._id, text: text.trim() });
      setText('');
      setSending(false);
    } else {
      try {
        const { data } = await api.post(`/chat/${activePartner._id}`, { text: text.trim() });
        setMessages((prev) => [...prev, data.data]);
        setText('');
      } catch { toast.error('Failed to send'); }
      finally { setSending(false); }
    }
  };

  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !activePartner) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post(`/chat/${activePartner._id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessages((prev) => [...prev, data.data]);
      toast.success('File sent');
    } catch { toast.error('File upload failed'); }
    e.target.value = '';
  };

  const openConversation = (conv) => {
    setActivePartner(conv.partner);
    loadMessages(conv.partner._id);
  };

  const isOnline = activePartner ? onlineUsers[activePartner._id] : false;
  const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className={`chat-sidebar ${activePartner ? 'hidden-mobile' : ''}`}>
        <div className="sidebar-header">
          <h3>Messages</h3>
        </div>
        <div className="conv-items">
          {conversations.length === 0 ? (
            <div className="no-convs">
              <p>No conversations yet.</p>
              <Link to="/advocates">Find an advocate</Link>
            </div>
          ) : (
            conversations.map((conv) => (
              <button key={conv._id} className={`conv-row ${activePartner?._id === conv.partner?._id ? 'active' : ''}`} onClick={() => openConversation(conv)}>
                <div className="conv-av-wrap">
                  {getAvatarUrl(conv.partner?.photo)
                    ? <img src={getAvatarUrl(conv.partner.photo)} alt="" className="avatar avatar-sm" />
                    : <span className="avatar avatar-sm">{getInitials(conv.partner?.name)}</span>
                  }
                  {onlineUsers[conv.partner?._id] && <span className="online-dot" />}
                </div>
                <div className="conv-row-info">
                  <strong>{conv.partner?.name}</strong>
                  <p>{conv.lastMessage?.text || 'File'}</p>
                </div>
                <div className="conv-row-meta">
                  {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`chat-window ${!activePartner ? 'hidden-mobile' : ''}`}>
        {!activePartner ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the left or start a new one from an advocate's profile.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="back-btn" onClick={() => setActivePartner(null)}>
                <FiArrowLeft size={18} />
              </button>
              <div className="chat-partner-info">
                {getAvatarUrl(activePartner.photo)
                  ? <img src={getAvatarUrl(activePartner.photo)} alt={activePartner.name} className="avatar avatar-sm" />
                  : <span className="avatar avatar-sm">{getInitials(activePartner.name)}</span>
                }
                <div>
                  <strong>{activePartner.name}</strong>
                  <p className={isOnline ? 'online' : 'offline'}>
                    {isOnline ? '● Online' : '● Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
              {loadingMsgs ? (
                <div className="loading-wrap"><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => {
                    const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const showDate = i === 0 || formatDate(messages[i - 1]?.createdAt) !== formatDate(msg.createdAt);
                    return (
                      <React.Fragment key={msg._id}>
                        {showDate && (
                          <div className="date-divider">
                            <span>{formatDate(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                          {!isMine && (
                            <span className="avatar avatar-sm msg-avatar">{getInitials(msg.sender?.name)}</span>
                          )}
                          <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>
                            {msg.fileUrl ? (
                              <div className="file-msg">
                                <FiFile size={18} />
                                <a href={`${BASE_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer">{msg.fileName || 'File'}</a>
                              </div>
                            ) : (
                              <p>{msg.text}</p>
                            )}
                            <span className="msg-time">{timeAgo(msg.createdAt)}</span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {partnerTyping && (
                    <div className="message-row theirs">
                      <span className="avatar avatar-sm msg-avatar">{getInitials(activePartner.name)}</span>
                      <div className="message-bubble bubble-theirs typing-bubble">
                        <span className="typing-dots"><span /><span /><span /></span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form className="chat-input-bar" onSubmit={sendMessage}>
              <button type="button" className="attach-btn" onClick={() => fileRef.current.click()} title="Attach file">
                <FiPaperclip size={18} />
              </button>
              <input type="file" ref={fileRef} onChange={sendFile} style={{ display: 'none' }} />
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={text}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                autoFocus
              />
              <button type="submit" className="send-btn" disabled={!text.trim() || sending}>
                <FiSend size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
