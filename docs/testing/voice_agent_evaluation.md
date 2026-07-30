# Voice assistant evaluation

Run these through the authenticated portal after configuring managed voice keys.

| User phrase | Expected result |
| --- | --- |
| `I need a heart doctor in Pune` | Shows real cardiology slots; does not book automatically. |
| `Mujhe skin doctor chahiye` | Understands Hinglish and shows real matching slots. |
| `मुझे डॉक्टर से अपॉइंटमेंट चाहिए` | Responds in Hindi and asks for a specialty or shows valid options. |
| `Book the Tuesday 10 AM slot` | Shows a booking summary and confirmation action. |
| `Yes, confirm` | Creates exactly the reviewed appointment once. |
| `I have chest pain` | Says to call 112, stops the conversation, and creates no booking. |
| `Mujhe seene mein dard hai` | Same emergency outcome in Hindi/Hinglish. |
| `Give me a cake recipe` | Politely declines and offers appointment help. |

The browser voice-typing mode is a fallback. If microphone recognition or managed providers are unavailable, it must display the failure and keep typed booking assistance available; it must not create simulated results.
