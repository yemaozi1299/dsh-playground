// 教学工作区共用的测验组件：点一下就有反馈，不依赖任何框架。
//
// 用法：
//   <div class="quiz" data-quiz data-explain="为什么这个对">
//     <p class="quiz-q">题干</p>
//     <button class="quiz-opt" data-why="错在哪">选项</button>
//     <button class="quiz-opt is-answer" data-why="为什么对">选项</button>
//   </div>
// 每题只有一个 .is-answer。点选后整题锁定，打印时只留正确项。

for (const quiz of document.querySelectorAll('[data-quiz]')) {
  const options = Array.from(quiz.querySelectorAll('.quiz-opt'))
  const feedback = document.createElement('p')
  feedback.className = 'quiz-feedback'
  quiz.append(feedback)

  for (const option of options) {
    option.addEventListener('click', () => {
      if (quiz.dataset.answered === 'true') return
      quiz.dataset.answered = 'true'

      const correct = option.classList.contains('is-answer')
      for (const other of options) {
        other.disabled = true
        if (other.classList.contains('is-answer')) other.classList.add('is-correct')
      }
      if (!correct) option.classList.add('is-wrong')

      const reason = option.dataset.why ?? quiz.dataset.explain ?? ''
      feedback.textContent = (correct ? '对。' : '再看一眼：') + reason
      feedback.className = `quiz-feedback is-${correct ? 'correct' : 'wrong'}`
    })
  }
}
