
# 澳门科技大学
# MACAU UNIVERSITY OF SCIENCE AND TECHNOLOGY
## 计算机科学与工程学院
## School of Computer Science and Engineering
### 创新工程学院
### Faculty of Innovation Engineering

| | |
| :--- | :--- |
| **作业ID (Homework ID):** | Task3-Structured Requirements Analysis |
| **报告标题 (Report Title):** | Link-Space-Chat 系统结构化需求分析 (Structured Requirements Analysis for Link-Space-Chat System) |
| **学生姓名 (Student Name):** | xxx |
| **学生编号 (Student No.):** | xxx |
| **日期 (Date):** | 2025年11月9日 (Nov 9, 2025) |

---

## 摘要 (Abstract)

本报告为“Link-Space-Chat 系统”提供了一份全面的结构化需求分析。该系统是一个支持实时消息、投票和P2P文件传输功能的通信应用。本报告的主要目标是采用结构化分析方法，为该系统建立一套完整、形式化的需求模型。

分析从三个不同的建模视角进行：功能、数据和行为。功能模型由层级化的数据流图（DFD）表示，包括上下文图（0级）、1级图以及针对消息处理子系统的2级详细图。微观规约作为补充，用于定义处理逻辑。数据模型则通过实体-关系图（E-R图）来描述，它定义了核心数据实体及其相互关系。最后，系统的动态行为通过状态转换图（STD）进行阐述，该图对客户端连接的生命周期进行了建模。

最终产出的模型为系统需求提供了清晰、无歧义的规约。数据流图阐明了数据处理流程，E-R图为数据库设计奠定了基础，状态转换图定义了关键的客户端状态与转换。这些成果共同为Link-Space-Chat系统的后续设计、开发和验证提供了明确的规划。

> **_Abstract_**
>
> _This report presents a comprehensive structured requirements analysis for the "Link-Space-Chat System," a communication application that supports real-time messaging, polling, and P2P file transfer functions. The main objective of this report is to establish a complete and formal requirements model for the system by adopting structured analysis methods._
>
> _The analysis is conducted from three different modeling perspectives: functional, data, and behavioral. The functional model is represented by a hierarchy of Data Flow Diagrams (DFDs), including a context diagram (Level 0), a Level 1 diagram, and a detailed Level 2 diagram for the message processing subsystem. Micro-specifications are included as a supplement to define the processing logic. The data model is described through an Entity-Relationship (E-R) diagram, which defines the core data entities and their interrelationships. Finally, the system's dynamic behavior is illustrated by a State Transition Diagram (STD) that models the lifecycle of a client connection._
>
> _The resulting models provide a clear and unambiguous specification for the system's requirements. The DFDs clarify the data processing flow, the E-R diagram establishes the foundation for database design, and the STD defines critical client states and transitions. Collectively, these artifacts provide a clear plan for the subsequent design, development, and verification of the Link-Space-Chat system._

---
---

## 目录 (Table of Contents)

- [摘要 (Abstract)](#摘要-abstract)
- [目录 (Table of Contents)](#目录-table-of-contents)
- [图目录 (List of Figures)](#图目录-list-of-figures)
- [表目录 (List of Tables)](#表目录-list-of-tables)
- [第一章 引言 (Chapter 1 Introduction)](#第一章-引言-chapter-1-introduction)
  - [1.1 项目背景 (Project Background)](#11-项目背景-project-background)
  - [1.2 报告目标 (Report Objectives)](#12-报告目标-report-objectives)
  - [1.3 报告结构 (Report Structure)](#13-报告结构-report-structure)
- [第二章 功能建模 (Chapter 2 Functional Modeling)](#第二章-功能建模-chapter-2-functional-modeling)
  - [2.1 数据流图 (Data Flow Diagrams)](#21-数据流图-data-flow-diagrams)
  - [2.2 微观规约 (Micro-specifications)](#22-微观规约-micro-specifications)
- [第三章 数据建模 (Chapter 3 Data Modeling)](#第三章-数据建模-chapter-3-data-modeling)
  - [3.1 实体-关系图 (Entity-Relationship Diagram)](#31-实体-关系图-entity-relationship-diagram)
- [第四章 行为建模 (Chapter 4 Behavioral Modeling)](#第四章-行为建模-chapter-4-behavioral-modeling)
  - [4.1 状态转换图 (State Transition Diagram)](#41-状态转换图-state-transition-diagram)
- [第五章 成员分工 (Chapter 5 Division of Labor)](#第五章-成员分工-chapter-5-division-of-labor)
- [第六章 结论 (Chapter 6 Conclusion)](#第六章-结论-chapter-6-conclusion)
- [参考文献 (References)](#参考文献-references)

---
---

## 图目录 (List of Figures)

- 图 2-1 Link-Space-Chat 系统的上下文图 (0级 DFD)
- 图 2-2 Link-Space-Chat 系统的1级 DFD
- 图 2-3 消息处理子系统的2级 DFD
- 图 3-1 Link-Space-Chat 系统的实体-关系图
- 图 4-1 客户端连接的状态转换图

> **_List of Figures_**
>
> - _Figure 2-1 Context Diagram (Level 0 DFD) of the Link-Space-Chat System_
> - _Figure 2-2 Level 1 DFD of the Link-Space-Chat System_
> - _Figure 2-3 Level 2 DFD for the Message Processing Sub-system_
> - _Figure 3-1 Entity-Relationship Diagram for the Link-Space-Chat System_
> - _Figure 4-1 State Transition Diagram for the Client Connection_

---
---

## 表目录 (List of Tables)

- 表 2-1 处理过程3.4“文件中转”的微观规约
- 表 2-2 处理过程3.6“P2P与WebRTC处理”的微观规约
- 表 5-1 成员分工表

> **_List of Tables_**
>
> - _Table 2-1 Micro-specification for Process 3.4 "File Relay"_
> - _Table 2-2 Micro-specification for Process 3.6 "P2P and WebRTC Handling"_
> - _Table 5-1 Division of Labor_

---
---

## 第一章 引言 (Chapter 1 Introduction)

### 1.1 项目背景 (Project Background)

Link-Space-Chat 系统是一个功能丰富的实时通信平台，旨在为即时通讯提供一个安全且功能多样的环境。该系统旨在满足市场对一个方便快捷，跨平台跨网络，线上沟通的需求。其核心功能包括免注册下载的轻量化、实时文本与表情符号通信、用于协作决策的群组投票系统，以及用于用户间直接文件传输的点对点（P2P）机制。此外，系统还将集成了WebRTC信令交换，为未来潜在的复杂通信功能奠定了基础，使其成为一个适应现代数字交互需求的、灵活且可扩展的解决方案。

> **_1.1 Project Background_**
>
> _The Link-Space-Chat system is a feature-rich real-time communication platform designed to provide a secure and versatile environment for instant messaging. The system aims to meet the market's demand for convenient, fast, cross-platform, and cross-network online communication. Its core features include being lightweight with no registration required for download, real-time text and emoji communication, a group polling system for collaborative decision-making, and a peer-to-peer (P2P) mechanism for direct file transfer between users. Additionally, the system integrates WebRTC signaling, laying the foundation for potential complex communication functions in the future, making it a flexible and scalable solution adapted to modern digital interaction needs._

### 1.2 报告目标 (Report Objectives)

本报告的主要目标是应用结构化需求分析，为Link-Space-Chat系统创建一个详细、形式化且无歧义的需求模型。该模型将作为软件开发生命周期所有后续阶段（包括系统设计、实现和测试）的基础蓝图。通过定义系统的功能、数据结构和动态行为，本报告旨在确保所有利益相关者对系统的范围和需求有一个共同且清晰的理解。

> **_1.2 Report Objectives_**
>
> _The primary objective of this report is to apply structured requirements analysis to create a detailed, formal, and unambiguous model of the Link-Space-Chat System. This model will serve as a foundational blueprint for all subsequent phases of the software development lifecycle, including system design, implementation, and testing. By defining the system's functions, data structures, and dynamic behavior, this report aims to ensure that all stakeholders have a common and clear understanding of the system's scope and requirements._

### 1.3 报告结构 (Report Structure)

本报告共分为六章。第二章详细阐述了系统的功能模型，展示了层级化的数据流图并辅以微观规约。第三章聚焦于数据模型，提供了一个实体-关系图及核心数据实体的描述。第四章通过客户端连接生命周期的状态转换图来描述系统的行为模型。第五章概述了本次分析任务中团队成员的分工。最后，第六章对已完成的工作进行总结，并简要讨论了未来的展望，从而结束本报告。

> **_1.3 Report Structure_**
>
> _This report is organized into six chapters. Chapter 2 details the system's functional model, presenting a hierarchy of Data Flow Diagrams supplemented with micro-specifications. Chapter 3 focuses on the data model, providing an Entity-Relationship diagram and a description of the core data entities. Chapter 4 describes the system's behavioral model through a State Transition Diagram for the client connection lifecycle. Chapter 5 outlines the division of labor among team members for this analysis task. Finally, Chapter 6 concludes the report with a summary of the work accomplished and a brief discussion of future prospects._

---
---

## 第二章 功能建模 (Chapter 2 Functional Modeling)

功能建模从数据处理能力的角度提供了对系统的审视。本章利用数据流图（DFD）来描绘数据如何在系统中流动，以及它如何被不同的处理过程所转换。

> **_Chapter 2 Functional Modeling_**
>
> _Functional modeling provides a view of the system from the perspective of its data processing capabilities. This chapter utilizes Data Flow Diagrams (DFDs) to illustrate how data moves through the system and how it is transformed by various processes._

### 2.1 数据流图 (Data Flow Diagrams)

数据流图以自顶向下、分层的方式呈现，从一个高层次的上下文图开始，逐步将过程分解为更详细的子过程。

> **_2.1 Data Flow Diagrams_**
>
> _DFDs are presented in a top-down, leveled fashion, starting from a high-level context diagram and progressively decomposing processes into more detailed sub-processes._

#### 2.1.1 上下文图 (0级 DFD) (Context Diagram - Level 0 DFD)

上下文图（如图 2-1）将整个Link-Space-Chat系统视为一个单一过程。它识别了与系统交互的外部实体以及它们之间的主要数据流。这些外部实体包括：`Host User`（主机用户/管理员）、`Participant User`（参与用户）、`Health Probe / Monitor`（健康探测/监控服务）和`Ngrok Tunnel Service`（Ngrok穿透服务）。

[在此处插入图 2-1：Link-Space-Chat 系统的上下文图 (0级 DFD)]
[Insert Figure 2-1: Context Diagram (Level 0 DFD) of the Link-Space-Chat System Here]

> **_2.1.1 Context Diagram (Level 0 DFD)_**
>
> _The context diagram (Figure 2-1) treats the entire Link-Space-Chat system as a single process. It identifies the external entities that interact with the system and the main data flows between them. These external entities include: `Host User`, `Participant User`, `Health Probe / Monitor`, and `Ngrok Tunnel Service`._

#### 2.1.2 1级 DFD (Level 1 DFD)

1级DFD（图 2-2）将上下文图中的主过程分解为几个主要的子系统。它揭示了系统的主要功能区域，并引入了主要的数据存储。识别出的核心处理过程是：`1.0 服务管理`、`2.0 会话与认证`、`3.0 消息处理` 和 `4.0 数据初始化`。关键的数据存储如 `D1 用户`、`D2 房间与成员` 和 `D3 消息` 被展示为系统数据的存储库。

[在此处插入图 2-2：Link-Space-Chat 系统的1级 DFD]
[Insert Figure 2-2: Level 1 DFD of the Link-Space-Chat System Here]

> **_2.1.2 Level 1 DFD_**
>
> _The Level 1 DFD (Figure 2-2) decomposes the main process from the context diagram into major sub-systems. It reveals the primary functional areas of the system and introduces the main data stores. The core processes identified are: `1.0 Service Management`, `2.0 Session and Authentication`, `3.0 Message Processing`, and `4.0 Data Initialization`. Key data stores like `D1 User`, `D2 Room & Members`, and `D3 Message` are shown as repositories of system data._

#### 2.1.3 消息处理的2级 DFD (Level 2 DFD for Message Processing)

为了提供更丰富的细节，1级DFD中的`3.0 消息处理`过程在图 2-3 中被进一步分解。这个2级图阐明了不同类型的消息是如何被处理的。子过程包括 `3.1 解析内容类型`、`3.2 标准消息处理`、`3.3 投票处理`、`3.4 文件中转`、`3.5 消息渲染与发送` 和 `3.6 P2P与WebRTC处理`。这个视图清晰地展示了路由和处理用户生成内容的逻辑。

[在此处插入图 2-3：消息处理子系统的2级 DFD]
[Insert Figure 2-3: Level 2 DFD for the Message Processing Sub-system Here]

> **_2.1.3 Level 2 DFD for Message Processing_**
>
> _To provide greater detail, the `3.0 Message Processing` process from the Level 1 DFD is further decomposed in Figure 2-3. This Level 2 diagram illustrates how different types of messages are handled. Sub-processes include `3.1 Parse Content Type`, `3.2 Standard Message Processing`, `3.3 Poll Processing`, `3.4 File Relay`, `3.5 Message Rendering and Sending`, and `3.6 P2P and WebRTC Handling`. This view clearly demonstrates the logic for routing and processing user-generated content._

### 2.2 微观规约 (Micro-specifications)

微观规约为DFD中那些无法再被分解的原子过程提供了详细的逻辑描述。下面描述了处理过程`3.4 文件中转`和`3.6 P2P与WebRTC处理`的逻辑。

*表 2-1: 处理过程3.4“文件中转”的微观规约*
| **处理过程ID** | 3.4 |
| :--- | :--- |
| **处理过程名称** | 文件中转 |
| **输入数据流** | `文件` |
| **输出数据流** | `文件元数据(格式化)`, `P2P服务请求` |
| **处理逻辑** | 1. 从`3.1解析内容类型`接收文件。<br>2. 记录该次消息的发送者，对文件进行解析，保留元数据（标题，文件类型等）并存入数据库。<br>3. 唤醒`3.6 P2P与WebRTC处理`以处理文件传输请求。 |

*表 2-2: 处理过程3.6“P2P与WebRTC处理”的微观规约*
| **处理过程ID** | 3.6 |
| :--- | :--- |
| **处理过程名称** | P2P与WebRTC处理 |
| **输入数据流** | `P2P启动`, `P2P请求`, `P2P信令` |
| **输出数据流** | `P2P服务请求` |
| **处理逻辑** | 1. 收到来自3.4的启动命令。<br>2. 解析3.4文件中转命令的发送者，读取文件元数据。<br>3. 等待`P2P服务请求`。<br>4. 接收`P2P服务请求`。<br>5. 检查请求者、请求文件、发送者是否合法。<br>6. **如果** 合法: <br>&nbsp;&nbsp;&nbsp;&nbsp; 6.1 联系发送者，请求建立`信令交换`。<br>&nbsp;&nbsp;&nbsp;&nbsp; 6.2 发送者与请求者通过本进程交换信令。<br>&nbsp;&nbsp;&nbsp;&nbsp; 6.3 记录日志。<br>7. **否则**：<br>&nbsp;&nbsp;&nbsp;&nbsp; 7.1 拒绝P2P请求。 |

> **_2.2 Micro-specifications_**
>
> _Micro-specifications provide detailed logic for the primitive processes in the DFDs that are not further decomposed. The following describes the logic for processes `3.4 File Relay` and `3.6 P2P and WebRTC Handling`._
>
> *Table 2-1: Micro-specification for Process 3.4 "File Relay"*
> | **Process ID** | 3.4 |
> | :--- | :--- |
> | **Process Name** | File Relay |
> | **Input Data Flow** | `File` |
> | **Output Data Flows** | `File Metadata (Formatted)`, `P2P Service Request` |
> | **Process Logic** | 1. Receive `File` from `3.1 Parse Content Type`.<br>2. Record the sender of the message, parse the file, and store its metadata (title, file type, etc.) in the database.<br>3. Awaken `3.6 P2P and WebRTC Handling` to process the file transfer request. |
>
> *Table 2-2: Micro-specification for Process 3.6 "P2P and WebRTC Handling"*
> | **Process ID** | 3.6 |
> | :--- | :--- |
> | **Process Name** | P2P and WebRTC Handling |
> | **Input Data Flows** | `P2P Start`, `P2P Request`, `P2P Signaling` |
> | **Output Data Flow** | `P2P Service Request` |
| **Process Logic** | 1. Receive start command from 3.4.<br>2. Parse the sender of the file relay command from 3.4 and read the file metadata.<br>3. Wait for a `P2P Service Request`.<br>4. Receive the `P2P Service Request`.<br>5. Check if the requester, requested file, and sender are legitimate.<br>6. **IF** legitimate: <br>&nbsp;&nbsp;&nbsp;&nbsp; 6.1 Contact the sender to request the establishment of `Signaling Exchange`.<br>&nbsp;&nbsp;&nbsp;&nbsp; 6.2 The sender and requester exchange signals through this process.<br>&nbsp;&nbsp;&nbsp;&nbsp; 6.3 Log the activity.<br>7. **ELSE**:<br>&nbsp;&nbsp;&nbsp;&nbsp; 7.1 Deny the P2P request. |

---
---

## 第三章 数据建模 (Chapter 3 Data Modeling)

数据建模关注系统数据的结构。它识别了基本的数据对象（实体）以及它们之间的关系，为系统的数据库设计提供了蓝图。

> **_Chapter 3 Data Modeling_**
>
> _Data modeling focuses on the structure of the system's data. It identifies the fundamental data objects (entities) and the relationships between them, providing a blueprint for the system's database design._

### 3.1 实体-关系图 (Entity-Relationship Diagram)

图 3-1 中的实体-关系图（E-R图）展示了Link-Space-Chat系统的概念数据模型。

[在此处插入图 3-1：Link-Space-Chat 系统的实体-关系图]
[Insert Figure 3-1: Entity-Relationship Diagram for the Link-Space-Chat System Here]

**实体描述:**
- **用户 (User)**: 代表系统的使用者，拥有如`id`、`昵称`和`密码哈希`等属性。
- **房间 (Room)**: 代表用户进行互动的聊天室。
- **消息 (Message)**: 代表用户在房间内发送的单条消息。
- **房间成员关系 (Room_Membership)**: 一个关联实体，用于连接用户和房间，表示多对多的关系。
- **投票 (Poll)**: 代表用户在房间内创建的一个投票。
- **投票选项 (Poll_Option)**: 代表一个投票中的单个选项。
- **表决 (Vote)**: 代表一个用户对某个特定投票选项投出的一票。

**关系描述:**
- 一个`用户`可以创建一个或多个`房间`（一对多）。
- 一个`用户`可以是多个`房间`的成员，一个`房间`也可以拥有多个`用户`作为成员（多对多，通过`房间成员关系`实现）。
- 一条`消息`由唯一一个`用户`发送，且属于唯一一个`房间`。
- 一个`投票`由一个`用户`创建，并与一个`房间`相关联。一个`投票`拥有多个`投票选项`。
- 一次`表决`由一个`用户`为一个`投票选项`投出。

> **_3.1 Entity-Relationship Diagram_**
>
> _The Entity-Relationship (E-R) diagram in Figure 3-1 illustrates the conceptual data model for the Link-Space-Chat System._
>
> **_Entity Descriptions:_**
> - _**User**: Represents a user of the system, with attributes like `id`, `nickname`, and `password_hash`._
> - _**Room**: Represents a chat room where users interact._
> - _**Message**: Represents a single message sent by a user in a room._
> - _**Room_Membership**: An associative entity that links users to rooms, representing a many-to-many relationship._
> - _**Poll**: Represents a poll created by a user in a room._
> - _**Poll_Option**: Represents a single choice within a poll._
> - _**Vote**: Represents a vote cast by a user for a specific poll option._
>
> **_Relationship Descriptions:_**
> - _A `User` can create one or more `Rooms` (one-to-many)._
> - _A `User` can be a member of many `Rooms`, and a `Room` can have many `Users` as members (many-to-many, facilitated by `Room_Membership`)._
> - _A `Message` is sent by exactly one `User` and belongs to exactly one `Room`._
> - _A `Poll` is created by one `User` and is associated with one `Room`. A `Poll` has multiple `Poll_Options`._
> - _A `Vote` is cast by one `User` for one `Poll_Option`._

---
---

## 第四章 行为建模 (Chapter 4 Behavioral Modeling)

行为建模描述了系统的动态方面，重点关注系统如何随时间响应事件。

> **_Chapter 4 Behavioral Modeling_**
>
> _Behavioral modeling describes the dynamic aspects of the system, focusing on how the system responds to events over time._

### 4.1 状态转换图 (State Transition Diagram)

图 4-1 中的状态转换图（STD）为客户端连接会话的生命周期进行了建模。它展示了一个会话可能处于的不同状态，以及触发状态间转换的事件。

[在此处插入图 4-1：客户端连接的状态转换图]
[Insert Figure 4-1: State Transition Diagram for the Client Connection Here]

**状态描述:**
- **开始 (Start)**: 会话的初始入口点。
- **在大厅 (InLobby)**: 客户端连接到服务器后、加入任何房间之前的状态。
- **加入中 (Joining)**: 系统处理用户加入房间请求时的过渡状态。
- **聊天中 (Chatting)**: 用户成功进入房间，可以发送/接收消息的主要状态。
- **重连中 (Reconnecting)**: 当网络连接丢失时进入的状态，在此期间系统尝试重新建立会话。
- **已断开 (Disconnected)**: 用户登出或重连尝试失败后的状态。
- **结束 (End)**: 会话的最终终止点。

**转换描述:**
- 一个用户事件`提交加入 (submit_join)`将使会话从`在大厅`转换到`加入中`。
- 一个系统事件`加入成功 (join_success)`将使会话从`加入中`移动到`聊天中`。
- 来自`聊天中`状态的`网络丢失 (network_lost)`事件会触发向`重连中`的转换。
- 在`重连中`状态下，一个`重连成功 (reconnect_success)`事件会引导会话回到`在大厅`，而一个`重连失败 (reconnect_failed)`事件则会导致`已断开`状态。

> **_4.1 State Transition Diagram_**
>
> _The State Transition Diagram (STD) in Figure 4-1 models the lifecycle of a client connection session. It shows the different states a session can be in and the events that trigger transitions between these states._
>
> **_State Descriptions:_**
> - _**Start**: The initial entry point of the session._
> - _**InLobby**: The state after a client connects to the server but before joining a room._
> - _**Joining**: A transient state while the system processes a user's request to join a room._
> - _**Chatting**: The primary state where a user is successfully in a room and can send/receive messages._
> - _**Reconnecting**: The state entered when a network connection is lost, during which the system attempts to re-establish the session._
> - _**Disconnected**: The state after a user logs out or a reconnection attempt fails._
> - _**End**: The final termination point of the session._
>
> **_Transition Descriptions:_**
> - _A user event `submit_join` transitions the session from `InLobby` to `Joining`._
> - _A system event `join_success` moves the session from `Joining` to `Chatting`._
> - _A `network_lost` event from the `Chatting` state triggers a transition to `Reconnecting`._
> - _In the `Reconnecting` state, a `reconnect_success` event leads back to `InLobby`, while a `reconnect_failed` event leads to `Disconnected`._

---
---

## 第五章 成员分工 (Chapter 5 Division of Labor)

本节概述了为完成此结构化分析报告，团队成员之间的任务分配。

*表 5-1: 成员分工表*
| **成员姓名** | **学号** | **负责任务** |
| :--- | :--- | :--- |
| 游翔宇 | xxx | - 负责数据建模，绘制E-R图，状态转换图，绘制各层级DFD，整理微观规约。<br>- 撰写报告第二、三章。 |
| 邢天舒 | yyy | - 负责功能建模，绘制各层级DFD。<br>- 撰写报告第一、四、五、六章。 |
| 孙宇轩 | zzz | - 负责行为建模，绘制状态转换图。<br>- 负责报告的最终整合、排版与审核。 |

> **_Chapter 5 Division of Labor_**
>
> _This section outlines the distribution of tasks among the team members for the completion of this structured analysis report._
>
> *Table 5-1: Division of Labor*
> | **Member Name** | **Student No.** | **Assigned Tasks** |
> | :--- | :--- | :--- |
> | You Xiangyu | xxx | - Responsible for data modeling, drawing the E-R diagram, state transition diagram, all levels of DFDs, and organizing micro-specifications.<br>- Wrote Chapters 2 and 3 of the report. |
> | Xing Tianshu | yyy | - Responsible for functional modeling and drawing all levels of DFDs.<br>- Wrote Chapters 1, 4, 5, and 6 of the report. |
> | Sun Yuxuan | zzz | - Responsible for behavioral modeling and drawing the state transition diagram.<br>- Responsible for the final integration, formatting, and review of the report. |

---
---

## 第六章 结论 (Chapter 6 Conclusion)

### 6.1 工作总结 (Summary of Work)

本报告成功地应用了结构化分析方法，为Link-Space-Chat系统开发了一套形式化的需求模型。通过创建功能、数据和行为模型，我们为系统预期的能力建立了一套清晰而全面的规约。层级化的数据流图定义了系统的过程和数据路径，实体-关系图明确了底层的数据结构，而状态转换图则阐明了客户端会话的动态行为。这些模型共同为项目的后续设计和实现阶段构筑了坚实的基础。

> **_6.1 Summary of Work_**
>
> _This report has successfully applied structured analysis methodologies to develop a formal requirements model for the Link-Space-Chat System. Through the creation of functional, data, and behavioral models, we have established a clear and comprehensive specification of the system's intended capabilities. The leveled Data Flow Diagrams define the system's processes and data pathways, the Entity-Relationship diagram specifies the underlying data structure, and the State Transition Diagram clarifies the dynamic behavior of a client session. These models collectively form a solid foundation for the project's subsequent design and implementation phases._

### 6.2 局限与未来工作 (Limitations and Future Work)

本报告中呈现的结构化分析提供了一个高层次的蓝图。某些操作细节，特别是关于安全协议和具体的WebRTC信令载荷，被进行了抽象化处理，需要在设计阶段进行更详细的规约。未来的工作将直接基于本次分析展开。下一个合理的步骤是开发软件架构和详细设计，使用E-R图作为数据库模式的基础，并以DFD和STD作为模块和组件设计的指导。

> **_6.2 Limitations and Future Work_**
>
> _The structured analysis presented in this report provides a high-level blueprint. Certain operational details, particularly concerning security protocols and specific WebRTC signaling payloads, are abstracted and will require further detailed specification during the design phase. Future work will proceed directly from this analysis. The next logical step is to develop the software architecture and detailed design, using the E-R diagram as a basis for the database schema and the DFDs and STD as guides for module and component design._

---
---

## 参考文献 (References)

[1] LeCun, Y., Bengio, Y., & Hinton, G. (2015). Deep learning. *Nature (London)*, 521(7553), 436–444. https://doi.org/10.1038/nature14539.
[2] B. Chen and J. Zhang, “Tuple density: A new metric for combinatorial test suites,” in *Proceeding of the 33rd International Conference on Software Engineering (ICSE’11)*, 2011, pp. 876–879.
[3] A. Arcuri and L. Briand, “Formal analysis of the probability of interaction fault detection using random testing,” *IEEE Transactions on Software Engineering*, vol. 38, no. 5, pp. 1088–1099, 2012.
[4] G. J. Myers, *The Art of Software Testing*. John Wiley & Sons: New York, 2004.
[5] “Keras: The python deep learning library,” 2020, https://keras.io3.
[6] “scikit-learn, machine learning in python,” 2020, https://scikit-learn.org/stable/.
