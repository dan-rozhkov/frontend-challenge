EN

Prototype: https://dan-rozhkov.github.io/frontend-challenge/

Built a prototype for editing a message and rolling back file changes in the test. There's research on [Figma](https://www.figma.com/design/wYdSTw1VxhCq6w87Ofe9cO/Frontend-Challenge?node-id=67-2&t=4ZAhSk78aDKkZ5pU-1) - I looked at how this done across different AI chats and code editors. Went with simplest solution so I don't overload the user.

Manual QA think in steps/scenarios, so I made the message act as a checkpoint. Here's why:

- nothing new to learn - these are their own messages, which they can edit or roll back to from that point
- covers two scenarios at once - "agent messed up, roll back and re-ask" and "I want to add a detail, just roll back to here"

On rollback/edit we ask the user to confirm. We roll back fully - both the chat and the file state. Manual QA don't split chat and file, for them it's a single step - not gonna overcomplicate it. The rollback goes through the mock backend, takes ~5s and sometimes fails. While it's running - a loader with an option to cancel. If it fails - inline error, I don't touch the state, no data is lost.

Other options I considered:

- diff branches - require understanding the code, no value for manual QA
- separate rollback (chat and file apart) - for QA it's one step, the extra choice just confuses
- rollback instantly without confirm - faster, but accidental clicks are possible

Didn't do due to the time limit:

- a separate Retry button on rollback error
- undo after successful rollback - postponed, confirm covers the accidental-click risk for now

What's next:

- collect analytics on button clicks, then decide - keep both or just one of the two
- build that Retry on rollback error, so the user isn't dragged through the actions again
- watch it in prod, see if confirm gets annoying on frequent rollbacks - if it does, replace with undo

ps: not related to the task, but other things I did

- memoized messages, rendering is smoother now
- fixed layout bugs
- restored the agent state on load
- accessibility: keyboard/focus
- made the UI components in Figma (code-to-figma) to "polish" them further

---

RU

Ссылка на прототип: https://dan-rozhkov.github.io/frontend-challenge/

Сделал прототип функционала редактирования сообщения и отката изменений в файле теста. По ссылке на [фигму](https://www.figma.com/design/wYdSTw1VxhCq6w87Ofe9cO/Frontend-Challenge?node-id=67-2&t=4ZAhSk78aDKkZ5pU-1) есть ресерч - просмотрел как реализовано в разных AI-чатах и редакторах кода. Решение выбрал максимально простое, чтобы не нагружать пользователя.

Manual QA мыслят шагами/сценариями, поэтому решил сделать сообщение как чекпоинт. Вот почему:

- не нужно учить пользователя новому - это его же сообщения, которые можно отредактировать или откатить до этой точки
- закрываем сразу 2 сценария - "агент ошибся, откатить и переспросить" и "хочу доуточнить, просто откати до этого места"

При откате/редактировании спрашиваем у пользователя подтверждение. Откатываемся полностью - и переписка, и состояние файла. Manual QA не делит чат и файл, для него это единый шаг - не будем усложнять. Откат идёт через мок-бэкенд в течение ~5s и иногда падает. Пока крутится - лоадер с возможностью отменить. Если упал - инлайн-ошибка, стейт не трогаю, данные не теряются.

Какие варианты рассматривал еще:

- diff-ветки - требуют понимания кода, не несут ценности для manual QA
- раздельный откат (отдельно чат, отдельно файл) - для QA это один шаг, лишний выбор только путает
- откат сразу без подтверждения - быстрее, но возможны случайные нажатия

Что не делал из-за лимита по времени:

- отдельная кнопка Retry на ошибке отката
- undo после успешного отката - отложил, confirm пока закрывает риск случайного клика

Что дальше:

- собрать аналитику по кликам на кнопках, в результате выбрать - либо оставить обе, либо одну из двух
- сделать тот самый Retry на ошибке отката, чтобы не гонять юзера через действия заново
- посмотреть на проде, не мешает ли confirm при частых откатах - если бесит, заменить на undo

ps: не относится к задаче, но что еще сделал

- мемоизация сообщений, теперь рендеринг плавнее
- пофиксил баги в верстке
- вернул состояние агента при загрузке
- доступность: клавиатура/фокус
- сделал UI компоненты в Figma (code-to-figma), чтобы "полировать" их дальше
