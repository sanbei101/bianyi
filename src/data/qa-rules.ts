import type { QARule } from '../types'

export const qaRules: QARule[] = [
  // 编译原理
  {
    id: 1,
    keywords: ['词法分析', '词法', 'lexer', 'scanner'],
    course: 'compiler',
    question: '什么是词法分析？',
    answer: '词法分析（Lexical Analysis）是编译过程的第一个阶段，其任务是将源程序作为字符流读入，然后按照语言的词法规则将其转换成一个一个的标记（Token）序列。词法分析器（Lexer/Scanner）负责识别标识符、关键字、常量、运算符等基本词素。'
  },
  {
    id: 2,
    keywords: ['语法分析', '语法', 'parser', 'syntax'],
    course: 'compiler',
    question: '什么是语法分析？',
    answer: '语法分析（Syntax Analysis）是编译过程的核心阶段，其任务是在词法分析的基础上，根据编程语言的语法规则（文法），将词法分析产生的Token序列组织成语法树或语法结构。常用的语法分析方法包括自顶向下的递归下降分析、LL(1)分析，以及自底向上的LR(0)、SLR(1)、LALR(1)和LR(1)分析。'
  },
  {
    id: 3,
    keywords: ['语义分析', '语义'],
    course: 'compiler',
    question: '什么是语义分析？',
    answer: '语义分析（Semantic Analysis）是编译过程的一个重要阶段，负责检查程序在语义上的正确性。主要任务包括：类型检查（验证操作数类型兼容性）、作用域分析（变量引用的有效性）、常值折叠（编译期计算常量表达式）等。语义分析通常使用属性文法来描述。'
  },
  {
    id: 4,
    keywords: ['正则表达式', '正则', 'regular expression', 'regex'],
    course: 'compiler',
    question: '正则表达式是什么？',
    answer: '正则表达式是一种描述字符串模式的记号系统，用于定义正则语言。正则表达式由原子（单个字符或转义序列）、连接、联合（|）和闭包（*）运算组成。正则表达式与有限自动机（DFA/NFA）等价，可以用来描述词法分析器支持的词素模式。'
  },
  {
    id: 5,
    keywords: ['有限自动机', 'DFA', 'NFA', '自动机'],
    course: 'compiler',
    question: '什么是有限自动机？',
    answer: '有限自动机（Finite Automaton）是一种识别正则语言的抽象计算模型，分为确定性有限自动机（DFA）和非确定性有限自动机（NFA）。DFA的每个状态对每个输入符号只有唯一的转移，而NFA允许一个状态对同一输入符号有多个可能的转移。DFA比NFA更高效，但NFA更易构建。'
  },
  {
    id: 6,
    keywords: ['上下文无关文法', 'CFG', '文法', 'context-free'],
    course: 'compiler',
    question: '什么是上下文无关文法？',
    answer: '上下文无关文法（Context-Free Grammar, CFG）是描述编程语言语法的形式化方法，由四元组G=(V,T,P,S)定义：V是非终结符集合，T是终结符集合，P是产生式集合，S是开始符号。CFG比正则表达式表达能力更强，可以描述嵌套结构（如匹配括号），是大多数编程语言语法的基础。'
  },
  {
    id: 7,
    keywords: ['LL(1)', 'LL'],
    course: 'compiler',
    question: '什么是LL(1)文法？',
    answer: 'LL(1)文法是一类可以进行自顶向下分析的文法，第一个L表示从左到右扫描输入，第二个L表示最左推导，1表示只需向前看一个符号。LL(1)文法的特点是没有左递归，且产生式的SELECT集合互不相交。LL(1)分析器通过预测分析表决定选择哪个产生式进行推导。'
  },
  {
    id: 8,
    keywords: ['LR(0)', 'SLR', 'LALR', 'LR', '移入规约'],
    course: 'compiler',
    question: '什么是LR分析？',
    answer: 'LR分析是一种自底向上的语法分析技术，L表示从左到右扫描，R表示反向最右推导。LR分析器通过状态机（项目集规范族）来识别可规约的句柄。常见的LR分析方法包括LR(0)（最简单但能力有限）、SLR（简单LR）、LALR（Lookahead LR）和LR(1)（最通用但状态最多）。'
  },
  {
    id: 9,
    keywords: ['算符优先', '运算符优先', 'operator precedence'],
    course: 'compiler',
    question: '什么是算符优先文法？',
    answer: '算符优先文法是一种自底向上的分析技术，适用于只有二元运算符的表达式文法。它通过定义终结符之间的优先关系（≺、≻、＝）来确定句柄的边界。算符优先分析比LR分析速度快，但只能处理一类特殊的文法（不包含悬挂else冲突等）。'
  },
  {
    id: 10,
    keywords: ['语法树', '抽象语法树', 'AST', 'syntax tree'],
    course: 'compiler',
    question: '什么是语法树？',
    answer: '语法树（Parse Tree/AST）是表示源代码语法结构的树形结构。分析树（Parse Tree）包含所有语法信息包括冗余符号；抽象语法树（Abstract Syntax Tree, AST）则只保留语义相关的重要信息，更简洁。语法树在语义分析、代码生成等后续阶段中作为中间表示使用。'
  },

  // 数据结构
  {
    id: 11,
    keywords: ['栈', 'stack'],
    course: 'data-structure',
    question: '什么是栈？',
    answer: '栈（Stack）是一种后进先出（LIFO, Last In First Out）的线性数据结构。只允许在栈顶进行插入（push）和删除（pop）操作。栈的应用包括：函数调用栈、表达式求值（后缀表达式）、括号匹配、深度优先搜索等。'
  },
  {
    id: 12,
    keywords: ['队列', 'queue'],
    course: 'data-structure',
    question: '什么是队列？',
    answer: '队列（Queue）是一种先进先出（FIFO, First In First Out）的线性数据结构。只允许在队尾进行插入（enqueue），在队首进行删除（dequeue）。队列的变种包括循环队列、优先队列（Priority Queue）和双端队列（Deque）。队列的应用包括：任务调度、宽度优先搜索、消息队列等。'
  },
  {
    id: 13,
    keywords: ['链表', 'linked list'],
    course: 'data-structure',
    question: '什么是链表？',
    answer: '链表（Linked List）是一种线性数据结构，通过节点中的指针将数据元素链接起来。与数组不同，链表不支持随机访问，但插入和删除操作只需O(1)时间。常见的链表类型包括：单向链表、双向链表和循环链表。链表的优势是动态大小、插入删除高效，劣势是访问时间O(n)。'
  },
  {
    id: 14,
    keywords: ['二叉树', 'binary tree'],
    course: 'data-structure',
    question: '什么是二叉树？',
    answer: '二叉树（Binary Tree）是每个节点最多有两个子树的树形结构，通常称为左子树和右子树。二叉树的主要应用包括：表达式树、哈夫曼编码、二叉搜索树（BST）、堆等。二叉树的遍历方式包括：前序（根-左-右）、中序（左-根-右）、后序（左-右-根）和层序遍历。'
  },
  {
    id: 15,
    keywords: ['图', 'graph'],
    course: 'data-structure',
    question: '什么是图？',
    answer: '图（Graph）是由顶点（Vertex）和边（Edge）组成的非线性数据结构。图分为有向图和无向图，边可以有权重（加权图）。图的表示方法包括邻接矩阵和邻接表。图的遍历算法包括：深度优先搜索（DFS）和宽度优先搜索（BFS）。最短路径算法包括：Dijkstra、Bellman-Ford和Floyd-Warshall。'
  },
  {
    id: 16,
    keywords: ['排序', 'sort'],
    course: 'data-structure',
    question: '常见的排序算法有哪些？',
    answer: '常见排序算法包括：1) O(n²)算法：冒泡排序、选择排序、插入排序；2) O(nlogn)算法：快速排序、归并排序、堆排序；3) O(n)算法：计数排序、基数排序、桶排序。其中快速排序平均最快，归并排序稳定，堆排序最坏情况最优。'
  },
  {
    id: 17,
    keywords: ['查找', 'search'],
    course: 'data-structure',
    question: '常见的查找算法有哪些？',
    answer: '常见查找算法包括：1) 线性查找：顺序查找O(n)；2) 二分查找：适用于有序数组O(logn)；3) 二叉搜索树查找：平均O(logn)，最坏O(n)；4) 平衡二叉树（AVL、红黑树）：O(logn)；5) 哈希查找：平均O(1)，最坏O(n)。选择查找算法需要考虑数据规模和是否有序。'
  },
  {
    id: 18,
    keywords: ['哈希表', 'hash', '散列表'],
    course: 'data-structure',
    question: '什么是哈希表？',
    answer: '哈希表（Hash Table）是一种根据关键码值直接访问数据的数据结构，通过哈希函数将关键码映射到表中的位置来访问。哈希表的优势是查找、插入、删除平均时间复杂度为O(1)。主要问题包括：哈希冲突（解决方法：开放地址法、链地址法）和哈希函数设计。'
  },
  {
    id: 19,
    keywords: ['堆', 'heap'],
    course: 'data-structure',
    question: '什么是堆？',
    answer: '堆（Heap）是一种完全二叉树，分为最大堆和最小堆。最大堆中父节点大于等于子节点，最小堆中父节点小于等于子节点。堆通常用数组实现，堆排序时间复杂度O(nlogn)，且可以高效实现优先队列。常见的堆应用包括：Top-K问题、合并有序文件和哈夫曼编码。'
  },
  {
    id: 20,
    keywords: ['树', 'tree'],
    course: 'data-structure',
    question: '什么是树形结构？',
    answer: '树（Tree）是n个节点组成的层次结构，每个节点有零个或多个子节点，唯一没有父节点的节点称为根节点。树的主要类型包括：二叉树、AVL树、红黑树、B树、B+树、 Trie树等。树的应用非常广泛，包括：文件系统、数据库索引、XML/HTML解析、编译器抽象语法树等。'
  },

  // 计算机组成原理
  {
    id: 21,
    keywords: ['冯诺依曼', 'von Neumann'],
    course: 'computer-organization',
    question: '什么是冯诺依曼体系结构？',
    answer: '冯诺依曼体系结构（von Neumann Architecture）是现代计算机的基础，由数学家冯诺依曼提出。其核心特点是：计算机由运算器、控制器、存储器、输入设备和输出设备五大部分组成；程序和数据以同等地位存放在存储器中，按地址访问；指令和数据都用二进制表示；指令由操作码和地址码组成，顺序执行。'
  },
  {
    id: 22,
    keywords: ['CPU', '中央处理器', '处理器'],
    course: 'computer-organization',
    question: '什么是CPU？',
    answer: 'CPU（Central Processing Unit，中央处理器）是计算机的核心部件，负责执行指令和控制其他部件工作。CPU的主要组成部分包括：1) 运算器（ALU）：执行算术和逻辑运算；2) 控制器（CU）：控制指令执行流程；3) 寄存器组：存储临时数据。CPU的性能指标包括：字长、主频、缓存大小、指令集等。'
  },
  {
    id: 23,
    keywords: ['寄存器', 'register'],
    course: 'computer-organization',
    question: '什么是寄存器？',
    answer: '寄存器（Register）是CPU内部的高速存储部件，用于暂存指令、数据和运算结果。常见寄存器类型包括：1) 通用寄存器：暂存操作数；2) 程序计数器（PC）：指向下一条指令地址；3) 指令寄存器（IR）：存放当前指令；4) 程序状态字（PSW）：存储运算结果状态标志。寄存器访问速度比内存快得多。'
  },
  {
    id: 24,
    keywords: ['内存', '存储器', 'memory'],
    course: 'computer-organization',
    question: '计算机内存是如何工作的？',
    answer: '计算机内存（Memory）用于存储程序和数据。内存分为：1) 主存储器（RAM）：可读写，断电丢失，如DDR内存；2) 只读存储器（ROM）：断电不丢失，如BIOS。内存通过地址总线、数据总线和控制总线与CPU交互。内存管理涉及：地址映射、分段、分页、虚拟内存等技术。'
  },
  {
    id: 25,
    keywords: ['指令', 'instruction'],
    course: 'computer-organization',
    question: '什么是指令？',
    answer: '指令（Instruction）是计算机执行的基本操作，由操作码和操作数组成。指令类型包括：1) 数据传输指令：MOV、PUSH、POP；2) 算术运算指令：ADD、SUB、MUL、DIV；3) 逻辑运算指令：AND、OR、NOT；4) 控制流指令：JMP、CALL、RET；5) I/O指令：IN、OUT。指令格式有：零地址、一地址、二地址和三地址指令。'
  },
  {
    id: 26,
    keywords: ['总线', 'bus'],
    course: 'computer-organization',
    question: '什么是总线？',
    answer: '总线（Bus）是计算机各部件之间传输数据的公共通道。总线分为：1) 数据总线：传输数据，双向；2) 地址总线：传输内存地址，单向；3) 控制总线：传输控制信号。总线类型包括：前端总线（FSB）、PCIe、I2C、SPI等。总线带宽＝总线频率×总线宽度。'
  },
  {
    id: 27,
    keywords: ['ALU', '算术逻辑单元'],
    course: 'computer-organization',
    question: '什么是ALU？',
    answer: 'ALU（Arithmetic Logic Unit，算术逻辑单元）是CPU的核心组成部分，负责执行所有的算术运算和逻辑运算。算术运算包括：加、减、乘、除；逻辑运算包括：与、或、非、异或。ALU通常由组合逻辑电路构成，通过控制信号选择要执行的运算，并输出结果和状态标志（零标志、进位标志、溢出标志等）。'
  },
  {
    id: 28,
    keywords: ['缓存', 'cache'],
    course: 'computer-organization',
    question: '什么是缓存？',
    answer: '缓存（Cache）是位于CPU和主存之间的高速存储器，用于解决CPU和内存速度不匹配的问题。缓存基于局部性原理工作：时间局部性（最近访问的数据可能再次访问）和空间局部性（相邻数据可能被访问）。缓存分为L1、L2、L3多级。缓存映射方式包括：直接映射、组相联映射和全相联映射。'
  },
  {
    id: 29,
    keywords: ['I/O', '输入输出'],
    course: 'computer-organization',
    question: '什么是I/O系统？',
    answer: 'I/O（Input/Output，输入输出）系统负责计算机与外部设备之间的数据交换。I/O控制方式包括：1) 程序查询方式：CPU轮询检查设备状态；2) 中断方式：设备主动通知CPU；3) DMA方式：直接内存访问，CPU不参与数据传输。常见I/O接口包括：USB、PCI、PCIe、SATA、HDMI等。'
  },
  {
    id: 30,
    keywords: ['寻址方式', 'addressing'],
    course: 'computer-organization',
    question: '常见的寻址方式有哪些？',
    answer: '常见寻址方式包括：1) 立即寻址：操作数在指令中；2) 直接寻址：指令给出内存地址；3) 间接寻址：指令给出地址，地址指向操作数；4) 寄存器寻址：操作数在寄存器中；5) 寄存器间接寻址：寄存器给出内存地址；6) 相对寻址：PC加上偏移量；7) 基址变址寻址：基址寄存器加变址寄存器加偏移。不同寻址方式影响指令格式和程序灵活性。'
  }
]
