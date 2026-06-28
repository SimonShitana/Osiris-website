document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assignmentHelpForm');
    const reply = document.getElementById('assignmentHelpReply');
    if (!form) return;

    const email = OSIRIS_CONFIG?.founder?.email || 'osiris11978@gmail.com';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const session = OsirisAuth?.getSession();
        const subject = form.querySelector('[name="subject"]')?.value?.trim();
        const topic = form.querySelector('[name="topic"]')?.value?.trim();
        const details = form.querySelector('[name="details"]')?.value?.trim();

        const data = {
            studentName: session?.name || 'Anonymous',
            studentEmail: session?.email || '',
            subject,
            topic,
            details
        };

        try {
            if (window.OsirisDB) await OsirisDB.submitAssignmentEnquiry(data);

            const body = `Student: ${data.studentName}\nEmail: ${data.studentEmail}\nModule: ${subject}\nTopic: ${topic}\n\n${details}`;
            const mailto = `mailto:${email}?subject=${encodeURIComponent(`Assignment Help: ${subject}`)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;

            if (reply) reply.textContent = 'Enquiry saved. Opening your email app to send to Simon…';
            form.reset();
        } catch (ex) {
            if (reply) reply.textContent = ex.message || 'Could not submit. Email Simon directly.';
        }
    });
});
