pragma solidity ^0.4.18;

import "./TestFramework.sol";
import "./ArbitrationTest.sol";

contract TestLogger {

    event FailedTest(string message);
    event PassedTest(string message);
    event TotalTests(uint number);
    event PassedTests(uint number);
    event FailedTests(uint number);
    
    uint numPasses;
    uint numTests;
    address target;
    
    function TestCounter(address _target) public {
        target = _target;
    }
    
    function logTest(string name) public {
        if (target.call.gas(3000000)(bytes4 (keccak256(name)))) {
            PassedTest(name);
            numPasses += 1;
        }
        else
            FailedTest(name);
        numTests += 1;
    }
    
    function logSummary() public {
        TotalTests(numTests);
        PassedTests(numPasses);
        FailedTests(numTests - numPasses);
    }

}

contract TestSuite {

    //can receive money
    function() public payable {}
    
    function ArbitrationTests() public {
        ArbitrationTest t = new ArbitrationTest();
        t.transfer(1 ether);
        string[10] memory tests = [
            "testCreateContracts()",
            "testEarlyFinalize()",
            "testEarlyRefund()",
            "testUnauthorizedRefund()",
            "testUnauthorizedFinalize()",
            "testJudgeFinalize()",
            "testWinnerFinalize()",
            "testPublicFinalize()",
            "testJudgeRefund()",
            "testSellerRefund()"
        ];
        TestLogger l = new TestLogger();
        for (uint i = 0; i < tests.length; i++)
            l.logTest(tests[i]);
        l.logSummary();
    }

    function EnglishAuctionTests() public {
        ArbitrationTest t = new ArbitrationTest();
        t.transfer(1 ether);
        string[10] memory tests = [
            "testCreateContracts()",
            "testEarlyFinalize()",
            "testEarlyRefund()",
            "testUnauthorizedRefund()",
            "testUnauthorizedFinalize()",
            "testJudgeFinalize()",
            "testWinnerFinalize()",
            "testPublicFinalize()",
            "testJudgeRefund()",
            "testSellerRefund()"
        ];
        TestLogger l = new TestLogger();
        for (uint i = 0; i < tests.length; i++)
            l.logTest(tests[i]);
        l.logSummary();
    }

    function allTests() public {


    }
    
}
