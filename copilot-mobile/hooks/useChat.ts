import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';

import { Config } from '@/constants/Config';
import { getApiUrl, getSession } from '@/lib/auth';
import { addSavedMessage } from '@/src/notes/storage';
import {
  Message,
  PhpChatResponse,
  QuickReply,
} from '@/src/types';

type GenericChatResponse = PhpChatResponse & {
  reply?: string;
};

type SuggestedAction = {
  type?: string;
  title?: string;
  text?: string;
  value?: string;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [conversationId, setConversationId] =
    useState<string | undefined>(undefined);

  const [watermark, setWatermark] =
    useState<string | undefined>(undefined);

  const chatRole =
    (process.env.EXPO_PUBLIC_CHAT_ROLE || 'learner').trim() ||
    'learner';


  // ==========================================================
  // PROCESS API RESPONSE
  // ==========================================================

  const processBotResponse = useCallback(
    async (data: GenericChatResponse) => {

      // ---------------------------------------
      // SAVE CONVERSATION ID
      // ---------------------------------------

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }


      // ---------------------------------------
      // SAVE WATERMARK
      // ---------------------------------------

      if (data.watermark) {
        setWatermark(data.watermark);
      }


      // ---------------------------------------
      // GET BOT HTML/TEXT
      // ---------------------------------------

      const botTexts = (data.messages || [])
        .map((m) => m.content)
        .filter(
          (value): value is string =>
            Boolean(value && value.trim())
        );


      // ---------------------------------------
      // GET ACTIONS
      // ---------------------------------------

      const seenQuickReplyKeys =
        new Set<string>();


      const quickReplies: QuickReply[] =
        (data.actions || [])
          .map((item) => {

            const action =
              item as SuggestedAction;


            const value =
              action.value ||
              action.text ||
              action.title ||
              '';


            const label =
              action.title ||
              action.text ||
              action.value ||
              '';


            if (
              !value.trim() ||
              !label.trim()
            ) {
              return null;
            }


            const normalizedLabel =
              label.trim();

            const normalizedValue =
              value.trim();


            const actionType =
              action.type || 'imBack';


            const dedupeKey =
              `${actionType}::${normalizedLabel}::${normalizedValue}`;


            if (
              seenQuickReplyKeys.has(
                dedupeKey
              )
            ) {
              return null;
            }


            seenQuickReplyKeys.add(
              dedupeKey
            );


            return {
              label: normalizedLabel,
              value: normalizedValue,
              type: actionType,
            };
          })
          .filter(
            (value): value is QuickReply =>
              Boolean(value)
          );


      // ---------------------------------------
      // COMBINE BOT MESSAGES
      // ---------------------------------------

      const fullBotText =
        botTexts
          .join('\n\n')
          .trim();


      const latestReply =
        fullBotText.length > 0
          ? fullBotText
          : data.reply &&
              data.reply.trim()
            ? data.reply
            : quickReplies.length > 0
              ? 'Please choose an option below.'
              : null;


      if (!latestReply) {
        return;
      }


      // ---------------------------------------
      // ADD BOT MESSAGE
      // ---------------------------------------

      const botMessage: Message = {
        id: (
          Date.now() + 1
        ).toString(),

        text: latestReply,

        sender: 'bot',

        timestamp: new Date(),

        format: 'html',

        quickReplies,
      };


      setMessages(
        (prev) => [
          ...prev,
          botMessage,
        ]
      );
    },
    []
  );


  // ==========================================================
  // SEND NORMAL MESSAGE
  // ==========================================================

  const sendMessage = useCallback(
    async (text: string) => {

      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: 'user',
        timestamp: new Date(),
        format: 'text',
      };


      setMessages(
        (prev) => [
          ...prev,
          userMessage,
        ]
      );


      setIsLoading(true);


      try {

        const session =
          await getSession();


        if (!session) {

          throw new Error(
            'No active session. Please sign in again.'
          );
        }


        const response =
          await fetch(
            getApiUrl(),
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                message: text,
                email: session.email,
                name: session.name,
                role: chatRole,
                conversationId,
                watermark,
              }),
            }
          );


        if (!response.ok) {

          throw new Error(
            `Chat API failed with status ${response.status}`
          );
        }


        const raw =
          await response.text();


        let data:
          GenericChatResponse;


        try {

          data =
            JSON.parse(
              raw
            ) as GenericChatResponse;

        } catch {

          const preview =
            raw
              .slice(0, 140)
              .replace(
                /\s+/g,
                ' '
              )
              .trim();


          throw new Error(
            `Chat API returned non-JSON response: ${preview}`
          );
        }


        await processBotResponse(
          data
        );

      } catch (error) {

        console.error(
          'Send message error:',
          error
        );


        const errorText =
          error instanceof Error
            ? error.message
            : 'Unknown error';


        const errorMessage: Message = {
          id: (
            Date.now() + 1
          ).toString(),

          text:
            `Connection error: ${errorText}`,

          sender: 'bot',

          timestamp: new Date(),

          format: 'text',
        };


        setMessages(
          (prev) => [
            ...prev,
            errorMessage,
          ]
        );

      } finally {

        setIsLoading(false);
      }

    },
    [
      chatRole,
      conversationId,
      watermark,
      processBotResponse,
    ]
  );


  // ==========================================================
  // HANDLE QUICK REPLY / ACTION
  // ==========================================================

  const handleQuickReply =
    useCallback(
      async (
        reply: QuickReply
      ) => {

        // -----------------------------------
        // OPEN URL
        // -----------------------------------

        if (
          reply.type ===
          'openUrl'
        ) {

          try {

            await Linking.openURL(
              reply.value
            );

          } catch {

            Alert.alert(
              'Unable to open link',
              'The link could not be opened.'
            );
          }

          return;
        }


        // -----------------------------------
        // NORMAL BOT ACTION
        // imBack / messageBack etc.
        // -----------------------------------

        await sendMessage(
          reply.value
        );

      },
      [sendMessage]
    );


  // ==========================================================
  // SAVE MESSAGE
  // ==========================================================

  const saveToNote =
    useCallback(
      async (
        message: Message
      ) => {

        if (
          message.isSaved
        ) {

          Alert.alert(
            'Already saved',
            'This message is already in your notes.'
          );

          return;
        }


        try {

          await addSavedMessage(
            message.text
          );


          setMessages(
            (prev) =>
              prev.map(
                (item) =>
                  item.id ===
                  message.id
                    ? {
                        ...item,
                        isSaved:
                          true,
                      }
                    : item
              )
          );


          Alert.alert(
            'Saved',
            'Message saved to your notes.',
            [
              {
                text: 'OK',
                style:
                  'default',
              },
            ]
          );

        } catch {

          Alert.alert(
            'Error',
            'Failed to save message. Please try again.'
          );
        }

      },
      []
    );


  // ==========================================================
  // COPY MESSAGE
  // ==========================================================

  const copyMessage =
    useCallback(
      async (
        message: Message
      ) => {

        try {

          await Clipboard
            .setStringAsync(
              message.text
            );


          Alert.alert(
            'Copied',
            'Message copied to clipboard'
          );

        } catch {

          Alert.alert(
            'Error',
            'Failed to copy message'
          );
        }

      },
      []
    );


  // ==========================================================
  // SHARE MESSAGE
  // ==========================================================

  const shareMessage =
    useCallback(
      async (
        _message: Message
      ) => {

        // Share handled in ChatBubble
      },
      []
    );


  // ==========================================================
  // CLEAR CHAT
  // ==========================================================

  const clearChat =
    useCallback(() => {

      setMessages([]);

      setConversationId(
        undefined
      );

      setWatermark(
        undefined
      );

    }, []);


  // ==========================================================
  // SEND HIDDEN MESSAGE
  // ==========================================================

  const sendHiddenMessage =
    useCallback(
      async (
        text: string
      ) => {

        setIsLoading(true);


        try {

          const session =
            await getSession();


          if (!session) {

            throw new Error(
              'No active session. Please sign in again.'
            );
          }


          const response =
            await fetch(
              getApiUrl(),
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body:
                  JSON.stringify({
                    message: text,
                    email:
                      session.email,
                    name:
                      session.name,
                    role:
                      chatRole,
                    conversationId,
                    watermark,
                  }),
              }
            );


          if (
            !response.ok
          ) {

            throw new Error(
              `Chat API failed with status ${response.status}`
            );
          }


          const raw =
            await response.text();


          let data:
            GenericChatResponse;


          try {

            data =
              JSON.parse(
                raw
              ) as GenericChatResponse;

          } catch {

            const preview =
              raw
                .slice(0, 140)
                .replace(
                  /\s+/g,
                  ' '
                )
                .trim();


            throw new Error(
              `Chat API returned non-JSON response: ${preview}`
            );
          }


          await processBotResponse(
            data
          );

        } catch (error) {

          console.error(
            'Send hidden message error:',
            error
          );

        } finally {

          setIsLoading(false);
        }

      },
      [
        chatRole,
        conversationId,
        watermark,
        processBotResponse,
      ]
    );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    messages,

    isLoading,

    sendMessage,

    sendHiddenMessage,

    handleQuickReply,

    saveToNote,

    copyMessage,

    shareMessage,

    clearChat,

    maxLength:
      Config.chat
        .maxMessageLength,
  };
}