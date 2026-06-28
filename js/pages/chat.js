document.addEventListener('DOMContentLoaded', () => {

    const session = OsirisAuth?.getSession();

    if (!session) return;



    const container = document.getElementById('chatMessages');

    const form = document.getElementById('chatForm');

    const input = document.getElementById('chatInput');

    let lastCount = 0;



    function renderMessages(messages) {

        if (!messages?.length) {

            container.innerHTML = '<p class="chat-empty">No messages yet. Say hello to your colleagues!</p>';

            return;

        }

        container.innerHTML = messages.map((m) => {

            const mine = m.authorEmail === session.email;

            const isAdmin = OsirisAuth.isAdmin();

            const time = m.createdAt?.seconds

                ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                : new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const avatar = m.authorPhoto || OSIRIS_CONFIG?.assets?.defaultAvatar || '';

            return `<div class="chat-bubble chat-bubble--${mine ? 'mine' : 'other'}" data-id="${m.id}">

                <div class="chat-bubble__meta">

                    ${mine ? '' : `<img src="${avatar}" alt="">`}

                    <strong>${escapeHtml(m.authorName)}</strong>

                    <span>${time}</span>

                    ${isAdmin ? `<button type="button" class="chat-bubble__delete" data-delete="${m.id}" title="Delete"><i class="ri-delete-bin-line"></i></button>` : ''}

                </div>

                <div>${escapeHtml(m.text)}</div>

            </div>`;

        }).join('');

        container.scrollTop = container.scrollHeight;



        if (messages.length > lastCount && lastCount > 0) {

            const latest = messages[messages.length - 1];

            if (latest.authorEmail !== session.email) {

                OsirisNotifications?.push?.('chat', `${latest.authorName} sent a message`, latest.text.slice(0, 80), 'chat.html');

            }

        }

        lastCount = messages.length;



        container.querySelectorAll('[data-delete]').forEach((btn) => {

            btn.addEventListener('click', async (e) => {

                e.stopPropagation();

                if (!confirm('Delete this message?')) return;

                await OsirisDB.deleteChatMessage(btn.dataset.delete);

            });

        });

    }



    function loadLocal() {

        renderMessages(OsirisDB.getLocalChatMessages());

    }



    const unsub = OsirisDB.subscribeChatMessages((msgs) => {

        if (msgs === null) { loadLocal(); return; }

        renderMessages(msgs);

    });

    if (!window.OsirisFirebase?.ready) loadLocal();



    window.addEventListener('osiris-chat-local', (e) => {

        const list = OsirisDB.getLocalChatMessages();

        renderMessages(list);

    });

    window.addEventListener('storage', (e) => {

        if (e.key === 'osiris_chat_messages') {

            renderMessages(OsirisDB.getLocalChatMessages());

        }

    });



    form?.addEventListener('submit', async (e) => {

        e.preventDefault();

        const text = input.value.trim();

        if (!text) return;

        input.value = '';

        await OsirisDB.sendChatMessage({

            text,

            authorName: session.name,

            authorEmail: session.email,

            authorPhoto: OsirisAuth.getPhotoURL()

        });

    });



    window.addEventListener('beforeunload', () => unsub?.());

});



function escapeHtml(str) {

    const d = document.createElement('div');

    d.textContent = str || '';

    return d.innerHTML;

}


