import * as React from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { Loader2, MessageCircle, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'

import { MarketplaceNavbar } from '@/components/MarketplaceNavbar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/lib/auth'
import {
  type BasicUser,
  type Conversation,
  type Message,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessageHttp,
} from '@/lib/messaging'
import {
  ackToPromise,
  createMessagingSocket,
  type ReadReceipt,
  type MessagingSocket,
} from '@/lib/messaging-socket'
import { cn } from '@/lib/utils'

export default function MessagesPage() {
  const { data, isPending } = useSession()
  const userId = data?.user?.id
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [messages, setMessages] = React.useState<Message[]>([])
  const [activeConversationId, setActiveConversationId] = React.useState(
    searchParams.get('conversationId') ?? '',
  )
  const [draft, setDraft] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [isSocketConnected, setIsSocketConnected] = React.useState(false)
  const [typingConversationId, setTypingConversationId] = React.useState<string | null>(null)
  const [readReceipts, setReadReceipts] = React.useState<Record<string, ReadReceipt>>({})
  const [socket, setSocket] = React.useState<MessagingSocket | null>(null)
  const activeConversationIdRef = React.useRef(activeConversationId)
  const socketErrorShownRef = React.useRef(false)
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const typingStopTimeoutRef = React.useRef<number | null>(null)
  const typingClearTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    activeConversationIdRef.current = activeConversationId
  }, [activeConversationId])

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoadingMessages])

  React.useEffect(() => {
    const conversationId = searchParams.get('conversationId') ?? ''

    if (conversationId) {
      setActiveConversationId(conversationId)
    }
  }, [searchParams])

  React.useEffect(() => {
    if (!userId) {
      return
    }

    let ignore = false

    async function loadConversations() {
      setIsLoading(true)

      try {
        const result = await listConversations()

        if (!ignore) {
          setConversations(result)

          if (!activeConversationIdRef.current && result[0]) {
            setActiveConversation(result[0].id)
          }
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : 'No pudimos cargar tus chats')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadConversations()

    return () => {
      ignore = true
    }
  }, [userId])

  React.useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    let ignore = false

    async function loadConversationMessages() {
      setIsLoadingMessages(true)

      try {
        const result = await listMessages(activeConversationId)

        if (!ignore) {
          setMessages(result)
          const latest = result.at(-1)

          if (latest) {
            await markRead(activeConversationId, latest.id)
            setConversations((current) =>
              current.map((conversation) =>
                conversation.id === activeConversationId
                  ? { ...conversation, unreadCount: 0 }
                  : conversation,
              ),
            )
          }
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : 'No pudimos cargar mensajes')
        }
      } finally {
        if (!ignore) {
          setIsLoadingMessages(false)
        }
      }
    }

    loadConversationMessages()
  }, [activeConversationId])

  React.useEffect(() => {
    if (!userId) {
      return
    }

    const nextSocket = createMessagingSocket()

    setSocket(nextSocket)

    nextSocket.on('connect_error', () => {
      setIsSocketConnected(false)
      if (!socketErrorShownRef.current) {
        socketErrorShownRef.current = true
        toast.error('No pudimos conectar el chat en tiempo real')
      }
    })

    nextSocket.on('connect', () => {
      setIsSocketConnected(true)
      socketErrorShownRef.current = false
      const activeId = activeConversationIdRef.current

      if (activeId) {
        nextSocket.emit('conversation:join', { conversationId: activeId })
        syncActiveConversation(activeId)
      }
    })

    nextSocket.on('disconnect', () => {
      setIsSocketConnected(false)
    })

    nextSocket.on('message:new', (message) => {
      const activeId = activeConversationIdRef.current

      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) {
          return current
        }

        return message.conversationId === activeId
          ? [...current, message]
          : current
      })

      setConversations((current) =>
        bumpConversationWithMessage(current, message, activeId, userId),
      )

      if (message.conversationId === activeId) {
        markRead(message.conversationId, message.id).catch(() => undefined)
      }
    })

    nextSocket.on('conversation:updated', (conversation) => {
      setConversations((current) => upsertConversation(current, conversation))
    })

    nextSocket.on('messages:read', (receipt) => {
      setReadReceipts((current) => ({
        ...current,
        [receipt.conversationId]: receipt,
      }))
    })

    nextSocket.on('typing:start', (payload) => {
      setTypingConversationId(payload.conversationId)

      if (typingClearTimeoutRef.current) {
        window.clearTimeout(typingClearTimeoutRef.current)
      }

      typingClearTimeoutRef.current = window.setTimeout(() => {
        setTypingConversationId((current) =>
          current === payload.conversationId ? null : current,
        )
      }, 2500)
    })

    nextSocket.on('typing:stop', (payload) => {
      setTypingConversationId((current) =>
        current === payload.conversationId ? null : current,
      )
    })

    return () => {
      if (typingStopTimeoutRef.current) {
        window.clearTimeout(typingStopTimeoutRef.current)
      }
      if (typingClearTimeoutRef.current) {
        window.clearTimeout(typingClearTimeoutRef.current)
      }
      nextSocket.disconnect()
    }
  }, [userId])

  React.useEffect(() => {
    if (!socket || !activeConversationId) {
      return
    }

    socket.emit('conversation:join', { conversationId: activeConversationId })
  }, [socket, activeConversationId])

  async function syncActiveConversation(conversationId: string) {
    try {
      const [nextConversations, nextMessages] = await Promise.all([
        listConversations(),
        listMessages(conversationId),
      ])

      setConversations(nextConversations)
      setMessages(nextMessages)

      const latest = nextMessages.at(-1)

      if (latest) {
        await markRead(conversationId, latest.id)
      }
    } catch {
      // Reconnect sync is best-effort; regular UI actions still surface errors.
    }
  }

  async function markRead(conversationId: string, lastReadMessageId?: string) {
    if (socket?.connected) {
      await ackToPromise<unknown>((ack) => {
        socket.emit('messages:read', { conversationId, lastReadMessageId }, ack)
      })
      return
    }

    await markConversationRead(conversationId, lastReadMessageId)
  }

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const body = draft.trim()

    if (!activeConversationId || !body) {
      return
    }

    setIsSending(true)

    try {
      const created = socket?.connected
        ? await ackToPromise<Message>((ack) => {
            socket.emit('message:send', { conversationId: activeConversationId, body }, ack)
          })
        : await sendMessageHttp(activeConversationId, body)

      setMessages((current) => {
        if (current.some((message) => message.id === created.id)) {
          return current
        }

        return [...current, created]
      })
      setDraft('')
      stopTyping(activeConversationId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pudimos enviar el mensaje')
    } finally {
      setIsSending(false)
    }
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  function handleDraftChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value)

    if (!socket?.connected || !activeConversationId) {
      return
    }

    socket.emit('typing:start', { conversationId: activeConversationId })

    if (typingStopTimeoutRef.current) {
      window.clearTimeout(typingStopTimeoutRef.current)
    }

    typingStopTimeoutRef.current = window.setTimeout(() => {
      stopTyping(activeConversationId)
    }, 1200)
  }

  function stopTyping(conversationId: string) {
    if (!socket?.connected) {
      return
    }

    socket.emit('typing:stop', { conversationId })
  }

  function setActiveConversation(conversationId: string) {
    setActiveConversationId(conversationId)
    setSearchParams({ conversationId })
  }

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
          Cargando mensajes...
        </div>
      </div>
    )
  }

  if (!data?.user) {
    return <Navigate to="/login" replace />
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  )
  const lastOwnMessage = [...messages]
    .reverse()
    .find((message) => message.senderId === data.user.id)
  const peerReadReceipt = activeConversation
    ? readReceipts[activeConversation.id]
    : undefined
  const peerSawLastOwnMessage = Boolean(
    activeConversation &&
      lastOwnMessage &&
      peerReadReceipt?.userId === getPeerId(activeConversation, data.user.id) &&
      peerReadReceipt.lastReadMessageId === lastOwnMessage.id,
  )

  return (
    <div className="min-h-svh bg-background text-foreground">
      <MarketplaceNavbar user={data.user} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Mensajes</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Conversaciones del marketplace
            </h1>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link to="/">
              Volver al mercado
            </Link>
          </Button>
        </div>

        <section className="grid min-h-[70vh] gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
            <CardContent className="space-y-3 p-4">
              {isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando chats...
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition hover:bg-muted/60',
                      activeConversationId === conversation.id && 'border-primary bg-muted',
                    )}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar user={conversation.peer} fallbackId={getPeerId(conversation, data.user.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {conversation.listing?.title ?? 'Publicacion sin titulo'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {formatUserName(conversation.peer, getPeerId(conversation, data.user.id))}
                            </p>
                          </div>
                          {conversation.unreadCount ? (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 truncate text-xs text-muted-foreground">
                          {conversation.lastMessage?.body ?? 'Sin mensajes todavia'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Aun no tienes conversaciones.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-background shadow-sm shadow-foreground/5">
            <CardContent className="flex min-h-[70vh] flex-col p-0">
              {activeConversation ? (
                <>
                  <div className="border-b p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={activeConversation.peer} fallbackId={getPeerId(activeConversation, data.user.id)} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {activeConversation.listing?.title ?? 'Publicacion sin titulo'}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {formatUserName(activeConversation.peer, getPeerId(activeConversation, data.user.id))}
                          {activeConversation.peer?.email ? ` · ${activeConversation.peer.email}` : ''}
                        </p>
                      </div>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                        isSocketConnected
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}>
                        {isSocketConnected ? 'En linea' : 'Reconectando'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {isLoadingMessages ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Cargando mensajes...
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => {
                        const mine = message.senderId === data.user.id

                        return (
                          <div
                            key={message.id}
                            className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                          >
                            <div
                              className={cn(
                                'max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6',
                                mine
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground',
                              )}
                            >
                              <p className="whitespace-pre-wrap">{message.body}</p>
                              <p className="mt-1 text-[11px] opacity-70">
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                        <MessageCircle className="size-10" />
                        <p className="text-sm">Aun no hay mensajes. Inicia la conversacion.</p>
                      </div>
                    )}
                    {typingConversationId === activeConversation.id ? (
                      <p className="px-2 text-xs text-muted-foreground">
                        {formatUserName(activeConversation.peer, getPeerId(activeConversation, data.user.id))} esta escribiendo...
                      </p>
                    ) : null}
                    {peerSawLastOwnMessage ? (
                      <p className="text-right text-xs text-muted-foreground">Visto</p>
                    ) : null}
                    <div ref={messagesEndRef} />
                  </div>

                  <form className="border-t p-4" onSubmit={handleSendMessage}>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Textarea
                        value={draft}
                        onChange={handleDraftChange}
                        onKeyDown={handleDraftKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="min-h-16 flex-1 resize-none rounded-2xl"
                      />
                      <Button
                        type="submit"
                        className="rounded-2xl sm:self-end"
                        disabled={isSending || !draft.trim()}
                      >
                        {isSending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
                        Enviar
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                  <MessageCircle className="size-12" />
                  <p className="font-medium text-foreground">Selecciona una conversacion</p>
                  <p className="max-w-sm text-sm">
                    Contacta vendedores desde una publicacion para iniciar un chat.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

function getPeerId(conversation: Conversation, userId: string) {
  return conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId
}

function UserAvatar({ user, fallbackId }: { user?: BasicUser | null; fallbackId: string }) {
  return (
    <Avatar className="shrink-0">
      <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? user?.email ?? 'Usuario'} />
      <AvatarFallback>{getInitials(user, fallbackId)}</AvatarFallback>
    </Avatar>
  )
}

function formatUserName(user: BasicUser | null | undefined, fallbackId: string) {
  return user?.name?.trim() || user?.email?.trim() || `Usuario ${fallbackId.slice(0, 8)}`
}

function getInitials(user: BasicUser | null | undefined, fallbackId: string) {
  const source = user?.name?.trim() || user?.email?.trim() || fallbackId

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function bumpConversationWithMessage(
  conversations: Conversation[],
  message: Message,
  activeConversationId: string,
  userId: string,
) {
  const incrementUnread =
    message.conversationId !== activeConversationId && message.senderId !== userId

  return bumpConversation(
    conversations.map((conversation) =>
      conversation.id === message.conversationId
        ? {
            ...conversation,
            lastMessage: message,
            lastMessageId: message.id,
            lastMessageAt: message.createdAt,
            updatedAt: message.createdAt,
            unreadCount: incrementUnread
              ? (conversation.unreadCount ?? 0) + 1
              : conversation.unreadCount ?? 0,
          }
        : conversation,
    ),
    message.conversationId,
  )
}

function bumpConversation(conversations: Conversation[], conversationId: string) {
  const index = conversations.findIndex((conversation) => conversation.id === conversationId)

  if (index === -1) {
    return conversations
  }

  const next = [...conversations]
  const [conversation] = next.splice(index, 1)

  return conversation ? [conversation, ...next] : conversations
}

function upsertConversation(conversations: Conversation[], conversation: Conversation) {
  const previous = conversations.find((item) => item.id === conversation.id)
  const nextConversation = {
    ...previous,
    ...conversation,
    lastMessage: conversation.lastMessage ?? previous?.lastMessage ?? null,
    unreadCount: conversation.unreadCount ?? previous?.unreadCount ?? 0,
  }
  const existing = conversations.filter((item) => item.id !== conversation.id)

  return [nextConversation, ...existing]
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
