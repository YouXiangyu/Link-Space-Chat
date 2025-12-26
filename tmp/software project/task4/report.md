# 澳门科技大学
# MACAU UNIVERSITY OF SCIENCE AND TECHNOLOGY
## 计算机科学与工程学院
## School of Computer Science and Engineering
### 创新工程学院
### Faculty of Innovation Engineering

| | |
| :--- | :--- |
| **作业ID (Homework ID):** | Task4-Object-Oriented Requirements Analysis |
| **报告标题 (Report Title):** | Link Space Chat 系统面向对象需求分析 (Object-Oriented Requirements Analysis for Link Space Chat System) |
| **学生姓名 (Student Name):** | 游翔宇 (1230006152), 孙宇轩 (1230019445), 邢天舒 (1230002381) |
| **日期 (Date):** | 2025年11月 (November 2025) |

---

## 摘要 (Abstract)

本报告为"Link Space Chat 系统"提供了一份全面的面向对象需求分析。该系统是一个轻量级的即时消息平台，专为跨网络环境（局域网/公共互联网）设计，支持零认证门槛的即时通信体验。本报告的主要目标是采用面向对象分析方法，为该系统建立一套完整、形式化的需求模型。

分析从三个不同的建模视角进行：功能、静态和行为。功能模型由用例图（Use Case Diagram）表示，展示了系统的主要功能模块、参与者及其交互关系。静态模型则通过领域类图（Domain Class Diagram）来描述，它定义了系统的核心实体、属性、方法及其相互关系，包括持久化实体（Room、Message）和内存服务（RoomState、RateLimiter、MessageService）。最后，系统的动态行为通过序列图（Sequence Diagram）进行阐述，该图对关键用例的交互流程进行了详细建模，包括加入房间、发送消息、回复消息和离开房间等核心功能。

此外，本报告还提供了活动图（Activity Diagram）和状态机图（State Machine Diagram）作为补充图表，以更全面地描述系统的业务流程和状态转换。活动图展示了房间密码管理的完整业务流程，状态机图则描述了房间对象的状态转换过程。

最终产出的模型为系统需求提供了清晰、无歧义的规约。用例图阐明了系统的功能边界和用户交互，领域类图为系统架构设计奠定了基础，序列图定义了关键功能的交互流程，活动图和状态机图则补充了业务流程和状态管理的细节。这些成果共同为Link Space Chat系统的后续设计、开发和验证提供了明确的规划。

> **_Abstract_**
>
> _This report presents a comprehensive object-oriented requirements analysis for the "Link Space Chat System," a lightweight instant messaging platform designed for cross-network environments (local area network/public internet), supporting zero-authentication threshold instant communication experiences. The main objective of this report is to establish a complete and formal requirements model for the system by adopting object-oriented analysis methods._
>
> _The analysis is conducted from three different modeling perspectives: functional, static, and behavioral. The functional model is represented by Use Case Diagrams, demonstrating the main functional modules, actors, and their interaction relationships. The static model is described through Domain Class Diagrams, which define the core entities, attributes, methods, and their interrelationships, including persistent entities (Room, Message) and in-memory services (RoomState, RateLimiter, MessageService). Finally, the system's dynamic behavior is illustrated by Sequence Diagrams that provide detailed modeling of the interaction flows of key use cases, including core functions such as joining rooms, sending messages, replying to messages, and leaving rooms._
>
> _Additionally, this report provides Activity Diagrams and State Machine Diagrams as supplementary diagrams to more comprehensively describe the system's business processes and state transitions. Activity diagrams demonstrate the complete business process of room password management, while state machine diagrams describe the state transition process of room objects._
>
> _The resulting models provide a clear and unambiguous specification for the system's requirements. Use case diagrams clarify the system's functional boundaries and user interactions, domain class diagrams establish the foundation for system architecture design, sequence diagrams define the interaction flows of key functions, and activity and state machine diagrams supplement the details of business processes and state management. Collectively, these artifacts provide a clear plan for the subsequent design, development, and verification of the Link Space Chat system._

**关键词 (Keywords)**: 面向对象分析 (Object-Oriented Analysis), 用例图 (Use Case Diagram), 类图 (Class Diagram), 序列图 (Sequence Diagram), 聊天系统 (Chat System)

> **_Keywords_**: _Object-Oriented Analysis, Use Case Diagram, Class Diagram, Sequence Diagram, Chat System_

---

## 目录 (Table of Contents)

- [摘要 (Abstract)](#摘要-abstract)
- [目录 (Table of Contents)](#目录-table-of-contents)
- [图目录 (List of Figures)](#图目录-list-of-figures)
- [表目录 (List of Tables)](#表目录-list-of-tables)
- [第一章 引言 (Chapter 1 Introduction)](#第一章-引言-chapter-1-introduction)
  - [1.1 项目概述 (Project Overview)](#11-项目概述-project-overview)
  - [1.2 报告目标 (Report Objectives)](#12-报告目标-report-objectives)
  - [1.3 团队成员与分工 (Team Members and Division of Labor)](#13-团队成员与分工-team-members-and-division-of-labor)
- [第二章 功能建模 (Chapter 2 Functional Modeling)](#第二章-功能建模-chapter-2-functional-modeling)
  - [2.1 用例图概述 (Use Case Diagram Overview)](#21-用例图概述-use-case-diagram-overview)
  - [2.2 主要参与者 (Main Actors)](#22-主要参与者-main-actors)
  - [2.3 用例描述 (Use Cases Description)](#23-用例描述-use-cases-description)
- [第三章 静态建模 (Chapter 3 Static Modeling)](#第三章-静态建模-chapter-3-static-modeling)
  - [3.1 领域类模型概述 (Domain Class Model Overview)](#31-领域类模型概述-domain-class-model-overview)
  - [3.2 核心类描述 (Core Classes Description)](#32-核心类描述-core-classes-description)
  - [3.3 类关系 (Class Relationships)](#33-类关系-class-relationships)
- [第四章 动态建模 (Chapter 4 Dynamic Modeling)](#第四章-动态建模-chapter-4-dynamic-modeling)
  - [4.1 序列图：加入房间 (Sequence Diagram: Join Room)](#41-序列图加入房间-sequence-diagram-join-room)
  - [4.2 序列图：发送消息 (Sequence Diagram: Send Message)](#42-序列图发送消息-sequence-diagram-send-message)
  - [4.3 序列图：回复消息 (Sequence Diagram: Reply Message)](#43-序列图回复消息-sequence-diagram-reply-message)
  - [4.4 序列图：离开房间 (Sequence Diagram: Leave Room)](#44-序列图离开房间-sequence-diagram-leave-room)
- [第五章 补充图表 (Chapter 5 Additional Diagrams)](#第五章-补充图表-chapter-5-additional-diagrams)
  - [5.1 活动图：管理房间密码 (Activity Diagram: Manage Room Password)](#51-活动图管理房间密码-activity-diagram-manage-room-password)
  - [5.2 状态机图：房间状态 (State Machine Diagram: Room State)](#52-状态机图房间状态-state-machine-diagram-room-state)
- [参考文献 (References)](#参考文献-references)

---

## 图目录 (List of Figures)

- 图 2-1 Link Space Chat 系统的用例图
- 图 3-1 Link Space Chat 系统的领域类模型
- 图 4-1 序列图：加入房间
- 图 4-2 序列图：发送消息
- 图 4-3 序列图：回复消息
- 图 4-4 序列图：离开房间
- 图 5-1 活动图：管理房间密码
- 图 5-2 状态机图：房间状态

> **_List of Figures_**
>
> - _Figure 2-1 Use Case Diagram for Link Space Chat System_
> - _Figure 3-1 Domain Class Model for Link Space Chat System_
> - _Figure 4-1 Sequence Diagram: Join Room_
> - _Figure 4-2 Sequence Diagram: Send Message_
> - _Figure 4-3 Sequence Diagram: Reply Message_
> - _Figure 4-4 Sequence Diagram: Leave Room_
> - _Figure 5-1 Activity Diagram: Manage Room Password_
> - _Figure 5-2 State Machine Diagram: Room State_

---

## 表目录 (List of Tables)

- 表 1-1 团队成员与分工
- 表 2-1 用例描述
- 表 3-1 核心类描述
- 表 5-1 房间状态转换表

> **_List of Tables_**
>
> - _Table 1-1 Team Members and Division of Labor_
> - _Table 2-1 Use Cases Description_
> - _Table 3-1 Core Classes Description_
> - _Table 5-1 Room State Transition Table_

---

## 第一章 引言 (Chapter 1 Introduction)

### 1.1 项目概述 (Project Overview)

Link Space Chat 是一个轻量级的即时消息平台，专为跨网络环境（局域网/公共互联网）设计。该系统允许用户通过链接快速加入聊天室，无需注册或安装客户端，实现了零认证门槛的即时通信体验。系统旨在满足市场对便捷、快速、跨平台、跨网络的在线沟通需求，为现代数字交互提供一个灵活且可扩展的解决方案。

系统的核心特点包括：

1. **零认证门槛**：用户无需注册即可使用，只需输入昵称即可加入聊天室，降低了使用门槛，提升了用户体验
2. **跨网络支持**：支持局域网和公共互联网访问，可通过 ngrok 实现公网暴露，满足不同网络环境下的使用需求
3. **实时通信**：基于 Socket.IO 实现实时双向通信，确保消息的即时传递和接收
4. **房间管理**：支持创建多个聊天室，每个房间可设置密码保护，提供灵活的访问控制机制
5. **消息功能**：支持文本消息、消息回复、高亮消息等多种消息类型，增强用户交互体验
6. **性能优化**：采用 SQLite WAL 模式、消息频率限制、内存管理等优化措施，确保系统在高并发场景下的稳定运行

> **_1.1 Project Overview_**
>
> _Link Space Chat is a lightweight instant messaging platform designed for cross-network environments (local area network/public internet). The system allows users to quickly join chat rooms through links without registration or client installation, achieving a zero-authentication threshold instant communication experience. The system aims to meet the market's demand for convenient, fast, cross-platform, and cross-network online communication, providing a flexible and scalable solution for modern digital interaction._
>
> _The core features of the system include:_
>
> 1. _**Zero Authentication Threshold**: Users can use the system without registration, only need to enter a nickname to join a chat room, lowering the usage threshold and improving user experience_
> 2. _**Cross-Network Support**: Supports local area network and public internet access, can be exposed to the public network through ngrok, meeting usage needs in different network environments_
> 3. _**Real-Time Communication**: Based on Socket.IO to achieve real-time bidirectional communication, ensuring instant message delivery and reception_
> 4. _**Room Management**: Supports creating multiple chat rooms, each room can set password protection, providing flexible access control mechanisms_
> 5. _**Message Functions**: Supports various message types such as text messages, message replies, and highlighted messages, enhancing user interaction experience_
> 6. _**Performance Optimization**: Adopts SQLite WAL mode, message frequency limiting, memory management and other optimization measures to ensure stable system operation under high concurrency scenarios_

### 1.2 报告目标 (Report Objectives)

本报告的主要目标是应用面向对象需求分析方法，为 Link Space Chat 系统创建一个详细、形式化且无歧义的需求模型。该模型将作为软件开发生命周期所有后续阶段（包括系统设计、实现和测试）的基础蓝图。通过定义系统的功能、静态结构和动态行为，本报告旨在确保所有利益相关者对系统的范围和需求有一个共同且清晰的理解。

具体而言，本报告将通过以下建模维度来建立完整的需求模型：

1. **功能建模**：通过用例图描述系统的主要功能和参与者，明确系统的功能边界和用户交互
2. **静态建模**：通过领域类模型描述系统的核心实体、属性和关系，为系统架构设计奠定基础
3. **动态建模**：通过序列图描述关键用例的交互流程，详细展示系统各组件之间的协作关系
4. **补充建模**：通过活动图和状态机图描述业务流程和状态转换，补充系统的行为细节

> **_1.2 Report Objectives_**
>
> _The primary objective of this report is to apply object-oriented requirements analysis methods to create a detailed, formal, and unambiguous requirements model for the Link Space Chat System. This model will serve as a foundational blueprint for all subsequent phases of the software development lifecycle, including system design, implementation, and testing. By defining the system's functions, static structure, and dynamic behavior, this report aims to ensure that all stakeholders have a common and clear understanding of the system's scope and requirements._
>
> _Specifically, this report will establish a complete requirements model through the following modeling dimensions:_
>
> 1. _**Functional Modeling**: Describes the main functions and actors of the system through use case diagrams, clarifying the system's functional boundaries and user interactions_
> 2. _**Static Modeling**: Describes the core entities, attributes, and relationships of the system through domain class models, laying the foundation for system architecture design_
> 3. _**Dynamic Modeling**: Describes the interaction flows of key use cases through sequence diagrams, detailing the collaboration relationships between system components_
> 4. _**Supplementary Modeling**: Describes business processes and state transitions through activity diagrams and state machine diagrams, supplementing the behavioral details of the system_

### 1.3 团队成员与分工 (Team Members and Division of Labor)

本节概述了为完成此面向对象需求分析报告，团队成员之间的任务分配。

*表 1-1: 团队成员与分工*

| **成员姓名** | **学号** | **负责任务** |
| :--- | :--- | :--- |
| 游翔宇 | 1230006152 | - 项目负责人，负责用例图绘制、序列图绘制（加入房间、发送消息）、活动图绘制、报告编写 |
| 孙宇轩 | 1230019445 | - 负责领域类模型绘制、序列图绘制（回复消息、离开房间）、状态机图绘制 |
| 邢天舒 | 1230002381 | - 负责图表审查、报告格式整理、参考文献整理 |

> **_1.3 Team Members and Division of Labor_**
>
> _This section outlines the distribution of tasks among the team members for the completion of this object-oriented requirements analysis report._
>
> *Table 1-1: Team Members and Division of Labor*
>
> | **Member Name** | **Student No.** | **Assigned Tasks** |
> | :--- | :--- | :--- |
> | You Xiangyu | 1230006152 | - Project leader, responsible for use case diagram drawing, sequence diagram drawing (join room, send message), activity diagram drawing, and report writing |
> | Sun Yuxuan | 1230019445 | - Responsible for domain class model drawing, sequence diagram drawing (reply message, leave room), and state machine diagram drawing |
> | Xing Tianshu | 1230002381 | - Responsible for diagram review, report format organization, and reference compilation |

---

## 第二章 功能建模 (Chapter 2 Functional Modeling)

功能建模从用户交互和系统功能的角度提供了对系统的审视。本章利用用例图（Use Case Diagram）来描绘系统的主要功能、参与者及其交互关系，明确系统的功能边界和用户需求。

> **_Chapter 2 Functional Modeling_**
>
> _Functional modeling provides a view of the system from the perspective of user interactions and system functions. This chapter utilizes Use Case Diagrams to illustrate the main functions, actors, and their interaction relationships, clarifying the system's functional boundaries and user requirements._

### 2.1 用例图概述 (Use Case Diagram Overview)

Link Space Chat 系统的用例图（如图 2-1）展示了三个主要功能组：房间管理、消息功能和创建者专用功能。这些功能组清晰地划分了系统的功能边界，为后续的详细设计提供了基础。

系统包含两个主要参与者，它们代表了不同类型的用户角色和权限：

1. **Participant（普通用户）**：可以执行加入房间、发送消息、查看历史消息等基本功能。普通用户是系统的主要使用者，可以参与聊天室的基本交互活动。

2. **Room Creator（房间创建者）**：除了拥有普通用户的所有功能外，还可以管理房间信息，包括设置密码、修改房间名称和描述等。房间创建者是第一个加入房间的用户，拥有该房间的管理权限。

> **_2.1 Use Case Diagram Overview_**
>
> _The use case diagram of the Link Space Chat System (Figure 2-1) demonstrates three main functional groups: room management, message functions, and creator-specific functions. These functional groups clearly divide the system's functional boundaries, providing a foundation for subsequent detailed design._
>
> _The system contains two main actors, representing different types of user roles and permissions:_
>
> 1. _**Participant (Regular User)**: Can perform basic functions such as joining rooms, sending messages, and viewing message history. Regular users are the main users of the system and can participate in basic interaction activities in chat rooms._
>
> 2. _**Room Creator**: In addition to all the functions of regular users, can also manage room information, including setting passwords, modifying room names and descriptions. The room creator is the first user to join the room and has management permissions for that room._

**图 2-1 Link Space Chat 系统的用例图**

[在此处插入图 2-1：Link Space Chat 系统的用例图]
[Insert Figure 2-1: Use Case Diagram for Link Space Chat System Here]

*图片文件: `1-F2-1-Use-Case-Diagram-for-Link-Space-Chat-System.drawio`*

> **_Figure 2-1 Use Case Diagram for Link Space Chat System_**




### 2.2 用例描述 (Use Cases Description)

用例描述详细说明了系统中每个用例的功能、参与者和执行流程。下表列出了 Link Space Chat 系统的主要用例及其描述。

*表 2-1: 用例描述*

| **用例名称** | **参与者** | **描述** |
| :--- | :--- | :--- |
| Join Room | Participant | 用户通过输入房间ID、昵称和密码（如果需要）加入聊天室 |
| View Online Users | Participant | 查看当前房间的在线用户列表 |
| View Room Info | Participant | 查看房间的基本信息，包括房间名称、描述等 |
| Leave Room | Participant | 用户离开当前聊天室 |
| Input Room Password | Participant | 当房间需要密码时，用户输入密码进行验证 |
| Send Message | Participant | 用户发送文本消息到聊天室 |
| Reply Message | Participant | 用户回复其他用户的消息，支持引用显示 |
| Send Highlighted Message | Participant | 用户发送以 # 开头的高亮消息 |
| View History Messages | Participant | 查看聊天室的历史消息记录 |
| Search Messages | Participant | 在已加载的消息中进行文本搜索 |
| Receive Real-time Messages | Participant | 实时接收其他用户发送的消息 |
| Set Room Password | Room Creator | 创建者设置房间密码，保护房间访问 |
| Modify Room Name | Room Creator | 创建者修改房间名称 |
| Modify Room Password | Room Creator | 创建者修改房间密码，修改时会清空聊天记录 |
| Modify Room Description | Room Creator | 创建者修改房间描述信息 |
| Cancel Room Password | Room Creator | 创建者移除房间密码，将房间变为开放房间 |

> **_2.2 Use Cases Description_**
>
> _Use case descriptions detail the functions, actors, and execution flows of each use case in the system. The following table lists the main use cases of the Link Space Chat System and their descriptions._
>
> *Table 2-1: Use Cases Description*
>
> | **Use Case Name** | **Actor** | **Description** |
> | :--- | :--- | :--- |
> | Join Room | Participant | User joins a chat room by entering room ID, nickname, and password (if required) |
> | View Online Users | Participant | View the list of online users in the current room |
> | View Room Info | Participant | View basic information of the room, including room name, description, etc. |
> | Leave Room | Participant | User leaves the current chat room |
> | Input Room Password | Participant | When the room requires a password, user enters password for verification |
> | Send Message | Participant | User sends text messages to the chat room |
> | Reply Message | Participant | User replies to other users' messages, supporting quote display |
> | Send Highlighted Message | Participant | User sends highlighted messages starting with # |
> | View History Messages | Participant | View historical message records of the chat room |
> | Search Messages | Participant | Perform text search in loaded messages |
> | Receive Real-time Messages | Participant | Receive messages sent by other users in real-time |
> | Set Room Password | Room Creator | Creator sets room password to protect room access |
> | Modify Room Name | Room Creator | Creator modifies room name |
> | Modify Room Password | Room Creator | Creator modifies room password, clearing chat history when modified |
> | Modify Room Description | Room Creator | Creator modifies room description information |
> | Cancel Room Password | Room Creator | Creator removes room password, making the room open |

---

## 第三章 静态建模 (Chapter 3 Static Modeling)

静态建模关注系统的结构。它识别了基本的类对象（实体和服务）以及它们之间的关系，为系统的架构设计提供了蓝图。

> **_Chapter 3 Static Modeling_**
>
> _Static modeling focuses on the structure of the system. It identifies the fundamental class objects (entities and services) and the relationships between them, providing a blueprint for the system's architecture design._

### 3.1 领域类模型概述 (Domain Class Model Overview)

图 3-1 中的领域类模型（Domain Class Model）展示了 Link Space Chat 系统的核心类结构。该模型展示了系统的持久化实体、内存状态管理和业务逻辑服务之间的关系。持久化实体（Room、Message）存储在 SQLite 数据库中，用于数据的长期保存；内存服务（RoomState、RateLimiter、MessageService）运行在内存中，用于快速的状态管理和业务逻辑处理。

> **_3.1 Domain Class Model Overview_**
>
> _The Domain Class Model (Figure 3-1) illustrates the core class structure of the Link Space Chat System. This model demonstrates the relationships between persistent entities, in-memory state management, and business logic services. Persistent entities (Room, Message) are stored in the SQLite database for long-term data preservation; in-memory services (RoomState, RateLimiter, MessageService) run in memory for fast state management and business logic processing._

**图 3-1 Link Space Chat 系统的领域类模型**

[在此处插入图 3-1：Link Space Chat 系统的领域类模型]
[Insert Figure 3-1: Domain Class Model for Link Space Chat System Here]

*图片文件: `2-F3-1-Domain-Class-Model-for-Link-Space-Chat-System.drawio`*

> **_Figure 3-1 Domain Class Model for Link Space Chat System_**

### 3.2 核心类描述 (Core Classes Description)

领域类模型中的核心类可以分为两类：持久化实体类和内存服务类。持久化实体类用于存储系统的核心数据，内存服务类用于提供实时的状态管理和业务逻辑处理。

*表 3-1: 核心类描述*

| **类名** | **类型** | **描述** |
| :--- | :--- | :--- |
| Room | Entity (Persistent) | 房间实体，存储在 SQLite 数据库中。包含房间ID、名称、描述、密码、创建者session等信息 |
| Message | Entity (Persistent) | 消息实体，存储在 SQLite 数据库中。包含消息ID、房间ID、昵称、内容、创建时间、父消息ID、高亮标志等 |
| RoomState | Service (In-Memory) | 房间状态管理服务，维护内存中的房间和用户列表，用于快速查询在线用户和昵称占用情况 |
| RateLimiter | Service (In-Memory) | 消息频率限制器，防止用户刷屏。限制规则：每3秒最多5条消息 |
| MessageService | Service | 消息业务逻辑服务，负责消息类型检测、高亮检测、消息保存等业务逻辑 |

> **_3.2 Core Classes Description_**
>
> _The core classes in the domain class model can be divided into two categories: persistent entity classes and in-memory service classes. Persistent entity classes are used to store the core data of the system, while in-memory service classes are used to provide real-time state management and business logic processing._
>
> *Table 3-1: Core Classes Description*
>
> | **Class Name** | **Type** | **Description** |
> | :--- | :--- | :--- |
> | Room | Entity (Persistent) | Room entity, stored in SQLite database. Contains room ID, name, description, password, creator session, and other information |
> | Message | Entity (Persistent) | Message entity, stored in SQLite database. Contains message ID, room ID, nickname, content, creation time, parent message ID, highlight flag, etc. |
> | RoomState | Service (In-Memory) | Room state management service, maintains room and user lists in memory for fast querying of online users and nickname occupancy |
> | RateLimiter | Service (In-Memory) | Message frequency limiter to prevent user spamming. Limiting rule: maximum 5 messages per 3 seconds |
> | MessageService | Service | Message business logic service, responsible for message type detection, highlight detection, message saving, and other business logic |

### 3.3 类关系 (Class Relationships)

领域类模型中的类之间存在多种关系，这些关系定义了系统各组件之间的协作方式：

1. **Room 和 Message**：一对多关系，一个房间可以有多条消息。这种关系通过 Message 类中的 `room_id` 外键实现，确保了消息与房间的关联。

2. **Message 和 Message**：自引用关系，支持消息回复功能。通过 `parent_message_id` 字段，一条消息可以引用另一条消息作为父消息，实现了消息的回复和引用功能。

3. **RoomState**：依赖 Room 和 Message，维护内存中的房间状态。RoomState 服务通过查询数据库中的 Room 和 Message 实体来维护实时的房间状态信息。

4. **RateLimiter**：独立服务，用于消息频率限制。该服务不直接依赖其他实体类，独立运行以提供消息发送频率控制功能。

5. **MessageService**：依赖 Room 和 Message，提供消息相关的业务逻辑。该服务封装了消息的类型检测、高亮检测、保存等业务逻辑，为上层应用提供统一的消息处理接口。

> **_3.3 Class Relationships_**
>
> _There are various relationships between classes in the domain class model, which define how system components collaborate:_
>
> 1. _**Room and Message**: One-to-many relationship, where one room can have multiple messages. This relationship is implemented through the `room_id` foreign key in the Message class, ensuring the association between messages and rooms._
>
> 2. _**Message and Message**: Self-referential relationship supporting message reply functionality. Through the `parent_message_id` field, a message can reference another message as its parent, enabling message replies and references._
>
> 3. _**RoomState**: Depends on Room and Message, maintaining room state in memory. The RoomState service maintains real-time room state information by querying Room and Message entities in the database._
>
> 4. _**RateLimiter**: Independent service for message frequency limiting. This service does not directly depend on other entity classes and runs independently to provide message sending frequency control._
>
> 5. _**MessageService**: Depends on Room and Message, providing message-related business logic. This service encapsulates business logic such as message type detection, highlight detection, and saving, providing a unified message processing interface for upper-level applications._

---

## 第四章 动态建模 (Chapter 4 Dynamic Modeling)

动态建模描述了系统的动态方面，重点关注系统如何随时间响应事件，以及系统各组件之间的交互流程。本章通过序列图（Sequence Diagram）来详细阐述关键用例的交互过程，展示客户端、服务器端以及各个服务组件之间的消息传递和协作关系。

> **_Chapter 4 Dynamic Modeling_**
>
> _Dynamic modeling describes the dynamic aspects of the system, focusing on how the system responds to events over time and the interaction flows between system components. This chapter details the interaction processes of key use cases through Sequence Diagrams, demonstrating message passing and collaboration relationships between clients, servers, and various service components._

### 4.1 序列图：加入房间 (Sequence Diagram: Join Room)

加入房间是系统的核心用例之一。该序列图（如图 4-1）展示了用户加入房间的完整交互流程，包括密码验证、昵称检查、房间创建、历史消息加载等步骤。该流程涉及客户端、服务器、数据库以及多个服务组件的协作，确保了用户能够顺利加入聊天室并获取必要的上下文信息。

> **_4.1 Sequence Diagram: Join Room_**
>
> _Joining a room is one of the core use cases of the system. This sequence diagram (Figure 4-1) demonstrates the complete interaction flow of a user joining a room, including password verification, nickname checking, room creation, and historical message loading. This process involves collaboration between clients, servers, databases, and multiple service components, ensuring that users can successfully join chat rooms and obtain necessary contextual information._

**图 4-1 序列图：加入房间**

[在此处插入图 4-1：序列图：加入房间]
[Insert Figure 4-1: Sequence Diagram: Join Room Here]

*图片文件: `3-F4-1-Sequence-Diagram-Join-Room.drawio`*

> **_Figure 4-1 Sequence Diagram: Join Room_**

**主要流程说明**：

1. 用户输入房间ID、昵称和密码（如果需要）
2. 客户端发送 `join_room` 事件到服务器
3. 服务器获取房间信息，检查房间是否存在
4. 如果房间存在但在线用户为0，执行空房重置（清空消息和密码）
5. 如果房间有密码，验证用户输入的密码
6. 检查昵称是否已被占用（通过 RoomState）
7. 确保房间在数据库中存在（如果不存在则创建）
8. 将用户加入 Socket.IO 房间
9. 将用户添加到 RoomState 中
10. 获取历史消息（最近20条）
11. 广播房间信息和在线用户列表更新

**异常处理**：
- **密码错误**：返回错误信息，用户无法加入，客户端显示相应的错误提示
- **昵称占用**：返回错误信息，提示用户更换昵称，客户端引导用户重新输入

> **_Main Process Description_**
>
> 1. _User enters room ID, nickname, and password (if required)_
> 2. _Client sends `join_room` event to server_
> 3. _Server retrieves room information and checks if the room exists_
> 4. _If the room exists but has zero online users, perform empty room reset (clear messages and password)_
> 5. _If the room has a password, verify the user's entered password_
> 6. _Check if the nickname is already taken (through RoomState)_
> 7. _Ensure the room exists in the database (create if it doesn't exist)_
> 8. _Add user to Socket.IO room_
> 9. _Add user to RoomState_
> 10. _Retrieve historical messages (latest 20 messages)_
> 11. _Broadcast room information and online user list updates_
>
> **_Exception Handling_**
>
> - _**Password Error**: Returns error message, user cannot join, client displays corresponding error prompt_
> - _**Nickname Taken**: Returns error message, prompts user to change nickname, client guides user to re-enter_

### 4.2 序列图：发送消息 (Sequence Diagram: Send Message)

发送消息是系统最常用的功能。该序列图（如图 4-2）展示了消息发送的完整流程，包括频率限制检查、消息类型检测、高亮检测、消息保存和广播等步骤。该流程确保了消息的合法性、防止刷屏行为，并支持多种消息类型的自动识别和处理。

> **_4.2 Sequence Diagram: Send Message_**
>
> _Sending messages is the most commonly used function of the system. This sequence diagram (Figure 4-2) demonstrates the complete flow of message sending, including frequency limit checking, message type detection, highlight detection, message saving, and broadcasting. This process ensures message legitimacy, prevents spamming behavior, and supports automatic identification and processing of various message types._

**图 4-2 序列图：发送消息**

[在此处插入图 4-2：序列图：发送消息]
[Insert Figure 4-2: Sequence Diagram: Send Message Here]

*图片文件: `4-F4-2-Sequence-Diagram-Send-Message.drawio`*

> **_Figure 4-2 Sequence Diagram: Send Message_**

**主要流程说明**：

1. 用户输入消息文本
2. 客户端发送 `chat_message` 事件到服务器
3. 服务器检查用户是否在房间中
4. **频率限制检查**：RateLimiter 检查用户是否在3秒内发送超过5条消息
5. MessageService 检测消息类型（文本、高亮文本等）
6. MessageService 检测是否为高亮消息（以 # 开头的文本）
7. 保存消息到数据库
8. 记录消息时间戳到 RateLimiter
9. 广播消息给房间内所有用户

**异常处理**：
- **频率限制超限**：返回错误信息，消息不会被发送，前端显示提示，提示用户稍后再试

**特殊功能**：
- **高亮检测**：自动检测以 # 开头的文本，设置 `isHighlighted=true`，前端以特殊样式显示
- **消息类型检测**：自动识别消息类型（text、emoji等），为不同类型的消息应用相应的渲染逻辑

> **_Main Process Description_**
>
> 1. _User enters message text_
> 2. _Client sends `chat_message` event to server_
> 3. _Server checks if user is in the room_
> 4. _**Frequency Limit Check**: RateLimiter checks if user has sent more than 5 messages within 3 seconds_
> 5. _MessageService detects message type (text, highlighted text, etc.)_
> 6. _MessageService detects if it is a highlighted message (text starting with #)_
> 7. _Save message to database_
> 8. _Record message timestamp to RateLimiter_
> 9. _Broadcast message to all users in the room_
>
> **_Exception Handling_**
>
> - _**Frequency Limit Exceeded**: Returns error message, message will not be sent, frontend displays prompt, prompting user to try again later_
>
> **_Special Features_**
>
> - _**Highlight Detection**: Automatically detects text starting with #, sets `isHighlighted=true`, frontend displays with special style_
> - _**Message Type Detection**: Automatically identifies message types (text, emoji, etc.), applies corresponding rendering logic for different message types_

### 4.3 序列图：回复消息 (Sequence Diagram: Reply Message)

消息回复功能增强了用户之间的交互能力。该序列图（如图 4-3）展示了用户A发送消息，用户B回复消息的完整流程。该流程通过消息的引用关系实现了对话的上下文关联，提升了用户交互体验。

> **_4.3 Sequence Diagram: Reply Message_**
>
> _The message reply function enhances interaction capabilities between users. This sequence diagram (Figure 4-3) demonstrates the complete flow of User A sending a message and User B replying to the message. This process achieves contextual association of conversations through message reference relationships, improving user interaction experience._

**图 4-3 序列图：回复消息**

[在此处插入图 4-3：序列图：回复消息]
[Insert Figure 4-3: Sequence Diagram: Reply Message Here]

*图片文件: `5-F4-3-Sequence-Diagram-Reply-Message.drawio`*

> **_Figure 4-3 Sequence Diagram: Reply Message_**

**主要流程说明**：

1. 用户A发送原始消息，消息被保存并广播给所有用户
2. 用户B点击/长按消息，选择回复
3. 前端显示回复输入框，用户B输入回复内容
4. 客户端发送包含 `parentMessageId` 的回复消息
5. MessageService 保存回复消息到数据库（包含 parent_message_id）
6. 服务器广播包含 parentMessageId 的消息给所有用户
7. 前端根据 parentMessageId 查找父消息并显示回复引用块
8. 支持最多两层引用关系的显示，避免引用层级过深影响可读性

> **_Main Process Description_**
>
> 1. _User A sends original message, message is saved and broadcast to all users_
> 2. _User B clicks/long-presses message and selects reply_
> 3. _Frontend displays reply input box, User B enters reply content_
> 4. _Client sends reply message containing `parentMessageId`_
> 5. _MessageService saves reply message to database (including parent_message_id)_
> 6. _Server broadcasts message containing parentMessageId to all users_
> 7. _Frontend finds parent message based on parentMessageId and displays reply quote block_
> 8. _Supports display of up to two levels of reference relationships, avoiding excessive reference depth affecting readability_

### 4.4 序列图：离开房间 (Sequence Diagram: Leave Room)

离开房间功能处理用户退出聊天室的流程，包括从 RoomState 中移除用户、广播在线用户列表更新等。该序列图（如图 4-4）展示了用户离开房间时的完整交互过程，包括延迟清理机制，确保房间状态的正确维护。

> **_4.4 Sequence Diagram: Leave Room_**
>
> _The leave room function handles the process of users exiting chat rooms, including removing users from RoomState and broadcasting online user list updates. This sequence diagram (Figure 4-4) demonstrates the complete interaction process when users leave rooms, including delayed cleanup mechanisms, ensuring correct maintenance of room state._

**图 4-4 序列图：离开房间**

[在此处插入图 4-4：序列图：离开房间]
[Insert Figure 4-4: Sequence Diagram: Leave Room Here]

*图片文件: `6-F4-4-Sequence-Diagram-Leave-Room.drawio`*

> **_Figure 4-4 Sequence Diagram: Leave Room_**

**主要流程说明**：

1. 用户点击离开房间按钮
2. 客户端发送 `leave_room` 事件到服务器
3. 服务器从 Socket.IO 房间中移除用户
4. 从 RoomState 中移除用户
5. 如果房间内没有其他用户，启动延迟清理定时器（3分钟后清理）
6. 广播在线用户列表更新给剩余用户
7. 客户端断开连接，清理本地状态

**延迟清理机制**：
- 当房间内所有用户离开后，系统不会立即清理房间数据，而是启动一个3分钟的延迟定时器
- 如果在3分钟内又有新用户加入，定时器会被取消，房间状态得以保留
- 这种机制避免了频繁创建和销毁房间，提升了系统性能

> **_Main Process Description_**
>
> 1. _User clicks leave room button_
> 2. _Client sends `leave_room` event to server_
> 3. _Server removes user from Socket.IO room_
> 4. _Remove user from RoomState_
> 5. _If there are no other users in the room, start delayed cleanup timer (cleanup after 3 minutes)_
> 6. _Broadcast online user list update to remaining users_
> 7. _Client disconnects and cleans up local state_
>
> **_Delayed Cleanup Mechanism_**
>
> - _When all users leave the room, the system does not immediately clean up room data, but starts a 3-minute delayed timer_
> - _If a new user joins within 3 minutes, the timer is cancelled and room state is preserved_
> - _This mechanism avoids frequent creation and destruction of rooms, improving system performance_

---

## 第五章 补充图表 (Chapter 5 Additional Diagrams)

除了功能建模、静态建模和动态建模的核心图表外，本报告还提供了活动图和状态机图作为补充图表，以更全面地描述系统的业务流程和状态转换。这些补充图表有助于深入理解系统的业务逻辑和状态管理机制。

> **_Chapter 5 Additional Diagrams_**
>
> _In addition to the core diagrams of functional modeling, static modeling, and dynamic modeling, this report also provides activity diagrams and state machine diagrams as supplementary diagrams to more comprehensively describe the system's business processes and state transitions. These supplementary diagrams help to deeply understand the system's business logic and state management mechanisms._

### 5.1 活动图：管理房间密码 (Activity Diagram: Manage Room Password)

活动图展示了创建者管理房间密码的完整业务流程，包括权限验证、密码设置/修改/移除等决策点。该活动图（如图 5-1）清晰地描述了房间密码管理的各个步骤和决策分支，为系统实现提供了详细的业务逻辑指导。

> **_5.1 Activity Diagram: Manage Room Password_**
>
> _The activity diagram demonstrates the complete business process of room password management by creators, including permission verification, password setting/modification/removal, and other decision points. This activity diagram (Figure 5-1) clearly describes the various steps and decision branches of room password management, providing detailed business logic guidance for system implementation._

**图 5-1 活动图：管理房间密码**

[在此处插入图 5-1：活动图：管理房间密码]
[Insert Figure 5-1: Activity Diagram: Manage Room Password Here]

*图片文件: `7-F5-1-Activity-Diagram-Manage-Room-Password.drawio`*

> **_Figure 5-1 Activity Diagram: Manage Room Password_**

**主要流程说明**：

1. 创建者请求修改房间信息
2. 检查用户是否在房间中
3. 检查是否为默认房间（"1"不能设置密码）
4. 检查是否为房间创建者（权限验证）
5. 判断是否修改密码
6. **如果修改密码**：
   - 设置新密码或移除密码
   - 清空聊天记录（刷新房间机制）
7. **如果只修改名称/描述**：
   - 直接更新数据库
8. 更新数据库
9. 广播房间信息更新事件给所有用户

**决策点**：
- **是否为默认房间？**：默认房间（ID为"1"）具有特殊性质，不能设置密码，确保其始终开放
- **是否为房间创建者？**：只有房间创建者拥有管理房间信息的权限，通过 `creator_session` 进行验证
- **是否修改密码？**：区分密码修改和名称/描述修改，因为密码修改会触发房间重置机制
- **是设置密码还是移除密码？**：设置密码会将房间变为密码保护状态，移除密码则恢复为开放状态

> **_Main Process Description_**
>
> 1. _Creator requests to modify room information_
> 2. _Check if user is in the room_
> 3. _Check if it is the default room ("1" cannot set password)_
> 4. _Check if user is the room creator (permission verification)_
> 5. _Determine if password is being modified_
> 6. _**If modifying password**:_
>    - _Set new password or remove password_
>    - _Clear chat history (room refresh mechanism)_
> 7. _**If only modifying name/description**:_
>    - _Directly update database_
> 8. _Update database_
> 9. _Broadcast room information update event to all users_
>
> **_Decision Points_**
>
> - _**Is it the default room?**: The default room (ID "1") has special properties and cannot set a password, ensuring it remains always open_
> - _**Is the user the room creator?**: Only the room creator has permission to manage room information, verified through `creator_session`_
> - _**Is the password being modified?**: Distinguish between password modification and name/description modification, as password modification triggers room reset mechanism_
> - _**Is it setting or removing password?**: Setting password changes room to password-protected state, removing password restores to open state_

### 5.2 状态机图：房间状态 (State Machine Diagram: Room State)

状态机图展示了房间对象的状态转换，包括房间不存在、开放房间、密码保护房间、空房间等状态。该状态机图（如图 5-2）清晰地描述了房间在不同生命周期阶段的状态变化，以及触发状态转换的事件和条件。

> **_5.2 State Machine Diagram: Room State_**
>
> _The state machine diagram demonstrates the state transitions of room objects, including states such as room non-existent, open room, password-protected room, and empty room. This state machine diagram (Figure 5-2) clearly describes the state changes of rooms at different lifecycle stages, as well as events and conditions that trigger state transitions._

**图 5-2 状态机图：房间状态**

[在此处插入图 5-2：状态机图：房间状态]
[Insert Figure 5-2: State Machine Diagram: Room State Here]

*图片文件: `8-F5-2-State-Machine-Diagram-Room-State.drawio`*

> **_Figure 5-2 State Machine Diagram: Room State_**

**状态说明**：

1. **房间不存在**：系统初始化或房间从未被创建。这是房间的初始状态，表示该房间ID尚未在系统中使用。

2. **开放房间（无密码）**：无密码保护，任何用户可加入。这是房间的默认状态，用户只需输入房间ID和昵称即可加入。

3. **密码保护房间**：需要密码才能加入。创建者可以设置密码，将房间从开放状态转换为密码保护状态，提供额外的访问控制。

4. **空房间（待重置）**：所有用户离开后，延迟3分钟清理。这是房间的临时状态，系统会延迟清理以避免频繁创建和销毁房间。

> **_State Descriptions_**
>
> 1. _**Room Non-existent**: System initialization or room has never been created. This is the initial state of a room, indicating that the room ID has not been used in the system._
>
> 2. _**Open Room (No Password)**: No password protection, any user can join. This is the default state of a room, where users only need to enter room ID and nickname to join._
>
> 3. _**Password-Protected Room**: Requires password to join. Creators can set a password to convert the room from open state to password-protected state, providing additional access control._
>
> 4. _**Empty Room (Pending Reset)**: After all users leave, delayed cleanup after 3 minutes. This is a temporary state of the room, where the system delays cleanup to avoid frequent room creation and destruction._

**状态转换**：

*表 5-1: 房间状态转换表*

| **触发事件** | **源状态** | **目标状态** | **说明** |
| :--- | :--- | :--- | :--- |
| 系统初始化 | - | 房间不存在 | 系统启动时，所有房间都处于不存在状态 |
| 第一个用户加入 | 房间不存在 | 开放房间 | 当第一个用户加入时，房间被创建并进入开放状态 |
| 创建者设置密码 | 开放房间 | 密码保护房间 | 创建者可以设置密码，将房间转换为密码保护状态 |
| 创建者取消密码 | 密码保护房间 | 开放房间 | 创建者可以移除密码，将房间恢复为开放状态 |
| 所有用户离开 | 开放房间 / 密码保护房间 | 空房间（待重置） | 当所有用户离开时，房间进入空房间状态，启动延迟清理定时器（3分钟后清理） |
| 新用户加入空房间 | 空房间（待重置） | 开放房间 | 如果在延迟清理期间有新用户加入，房间会被重置为开放状态，并清空历史消息和密码 |
| 修改密码 | 密码保护房间 | 密码保护房间 | 修改密码时会清空聊天记录，确保房间状态的干净重置 |
| 延迟清理超时 | 空房间（待重置） | 结束状态 | 如果延迟清理定时器超时且没有新用户加入，房间数据将被清理 |

> **_State Transitions_**
>
> *Table 5-1: Room State Transition Table*
>
> | **Trigger Event** | **Source State** | **Target State** | **Description** |
> | :--- | :--- | :--- | :--- |
> | System Initialization | - | Room Non-existent | When the system starts, all rooms are in non-existent state |
> | First User Joins | Room Non-existent | Open Room | When the first user joins, the room is created and enters open state |
> | Creator Sets Password | Open Room | Password-Protected Room | Creator can set a password to convert the room to password-protected state |
> | Creator Cancels Password | Password-Protected Room | Open Room | Creator can remove the password to restore the room to open state |
> | All Users Leave | Open Room / Password-Protected Room | Empty Room (Pending Reset) | When all users leave, the room enters empty room state and starts delayed cleanup timer (cleanup after 3 minutes) |
> | New User Joins Empty Room | Empty Room (Pending Reset) | Open Room | If a new user joins during delayed cleanup, the room is reset to open state and historical messages and password are cleared |
> | Modify Password | Password-Protected Room | Password-Protected Room | Modifying password clears chat history, ensuring clean reset of room state |
> | Delayed Cleanup Timeout | Empty Room (Pending Reset) | End State | If the delayed cleanup timer times out and no new users join, room data will be cleaned up_

---

## 参考文献 (References)

[6] "Socket.IO Documentation," 2024, https://socket.io/docs/v4/.

[7] "SQLite Documentation," 2024, https://www.sqlite.org/docs.html.

[8] "Express.js Documentation," 2024, https://expressjs.com/.

> **_References_**
>
> [6] _"Socket.IO Documentation," 2024, https://socket.io/docs/v4/._
>
> [7] _"SQLite Documentation," 2024, https://www.sqlite.org/docs.html._
>
> [8] _"Express.js Documentation," 2024, https://expressjs.com/._

---

**报告完成时间**: 2025年11月 (November 2025)

